"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  STATION_DIAGNOSTIC,
  STATION_INTELLIGENCE,
  STATION_THOUGHTFORM,
  getBuildApproachFade,
  getExitGlowEnvelope,
  getMouthYieldFade,
  getWormholeExitStreak,
  getWormholeExitWarp,
} from "./sceneGeom";

/**
 * LatentWormholeWalls — subtle particle-based wormhole topology
 * around BOTH passthrough legs (ADR-018, world-owned corridor).
 *
 * The corridor between gates used to read as "open space with a few
 * shards drifting past". This layer turns each travel leg into a
 * loose particle shell so the viewer feels enclosed by a wormhole
 * while flying from one gate to the next — without ever building a
 * literal grid tube.
 *
 * Composition per leg (Thoughtform → Diagnostic and
 * Diagnostic → Intelligence):
 *
 *   1. **Longitudinal rails** — dotted lines that run along Z around
 *      an oval shell. About a third are partial rails (end midway
 *      through the leg) so the shell never reads as a closed cage.
 *      Rails drift slightly inward with depth so the shell visibly
 *      converges toward the optical axis.
 *
 *   2. **Aperture frames** — 3 sparse depth-gate frames per leg.
 *      Four gold corner anchors with short dawn arms in two
 *      directions plus mid-edge ticks. Sized just inside the rail
 *      shell so the camera passes through "stations" without ever
 *      seeing a closed rectangle.
 *
 *   3. **Topographic shelves** — a few rows of low-alpha dawn-soft
 *      dots below the optical axis. Faintly waved across X+Z so
 *      they suggest a latent floor receding into the corridor.
 *
 *   4. **Leg-2 exit aperture** (v3.12, Encode→Build only). The exit
 *      is articulated as STRUCTURE + LIGHT, not density:
 *        - Ring cadence: clean dotted ellipses with geometric Z
 *          compression toward the rim. The accelerating rhythm of
 *          rings passing the camera communicates "exit approaching"
 *          kinesthetically. Echoes the cross-ring vocabulary of the
 *          rest of the wormhole and the gimbal-ring grammar of the
 *          intelligence layer it leads to.
 *        - Exit glow (`<ExitGlow>` quad, see component below): a
 *          single warm radial gradient seated just past the mouth Z.
 *          Always on (faint at the Navigate park; resolved from haze
 *          by atmospheric perspective; brightens through the
 *          passthrough; yields to a low residual that backlights the
 *          gyroscope at the Build park). Drives `getExitGlowEnvelope`.
 *      The earlier dust-cloud articulation (volumetric funnel field
 *      of 3,200 additive dots + 8-petal flower bloom + radial ribs)
 *      was retired in v3.12: density-as-articulation summed into
 *      noise, the petal grammar fought the gyroscope's ring grammar,
 *      and gold-on-gold rim made the mouth compete with the Build
 *      hero. The new aperture reads with structure (rings) + light
 *      (glow) — the foreground gyro stays the focal mass, but the
 *      tunnel still earns its exit moment.
 *
 * Visibility contract (ADR-018):
 *
 *   - Geometry is WORLD-FIXED. Positions are generated once from a
 *     deterministic catalogue tied to the gate stations. There is
 *     NO idle motion — every dot holds still when the user stops
 *     scrolling, and the perceived flow comes from the camera
 *     dollying past the world-rigid points.
 *   - Each leg has its OWN progress reveal envelope. Leg 1 resolves
 *     after the camera leaves the opening Thoughtform read; leg 2
 *     resolves BEFORE the Diagnostic/Encode park (revised 2026-06-04)
 *     and the two leg spans nearly meet at the Diagnostic gate, so
 *     the rail shell stays continuously present from the entry
 *     flythrough through to the substrate — the left/right walls no
 *     longer drop out as the camera passes Encode. The opening
 *     Thoughtform park stays clean because leg 1 only lifts once the
 *     entry flythrough begins.
 *   - The leg-2 mouth ring channel (`uRevealMouth`) ramps EARLY (as
 *     the user leaves Thoughtform) AND yields BEFORE the Build park
 *     (`getMouthYieldFade`, [0.85, 0.92]) so rings clear the stage
 *     for the Build composition. The exit glow has its own bell
 *     (`getExitGlowEnvelope`) that lingers as a low residual past
 *     the park — the light persists, the rings don't.
 *   - Per-point camera-space depth fade is computed in the vertex
 *     shader so dots ahead of the camera fade in as they approach
 *     and clip out as they cross the near plane — same depth-focus
 *     pattern used by every other world-rigid layer on this route.
 *   - A small scroll-velocity opacity lift sharpens the read during
 *     active travel, but the baseline alpha cap stays subtle.
 *
 * Pairs with:
 *   - `LatentFieldTunnel`        : camera-relative ambient field +
 *                                 embedding vectors (sits BEHIND
 *                                 this layer in paint order).
 *   - `LatentTopographyContours` : world-fixed contour shards inside
 *                                 the shell (paints ABOVE this layer
 *                                 so contours read on the rails).
 *   - `InterGateCorridor`        : ring debris bands — the walls
 *                                 enclose the same Z bands that
 *                                 already host the debris.
 *   - `BrandmarkAccretionShell`  : the gyroscope intelligence layer
 *                                 the corridor exits ONTO. The exit
 *                                 glow's residual literally backlights
 *                                 it at the Build park.
 *
 * Mobile-narrow viewports skip the layer entirely, matching the
 * `LatentTopographyContours` gate, so tight viewports keep the
 * copy + brandmark composition uncluttered.
 */

// ── Palette ──────────────────────────────────────────────────────

const DAWN_HEX = "#ebe3d6";
const DAWN_SOFT_HEX = "#d6cdb5";
const GOLD_HEX = "#caa554";

// ── Shell geometry ──────────────────────────────────────────────

/** Oval cross-section of the wormhole shell. Wider than tall so the
 *  rails read with the 16:9-leaning corridor frame and clear the HUD
 *  rails (which sit roughly at the viewport extremes). */
export const SHELL_RX = 2.15;
export const SHELL_RY = 1.35;

/** How much each rail pulls inward at its far end. A larger inward
 *  drift gives the shell a clearer vanishing-point read — the rails
 *  visibly converge toward the optical axis as they recede, which
 *  is the single strongest cue that the user is flying through a
 *  tunnel and not past a flat picture. */
export const RAIL_INWARD_PULL = 0.28;

/** Longitudinal rails per leg. Bumped 14 -> 20 (2026-06-05 wall
 *  presence pass) so the shell reads as a denser tunnel — the
 *  perceived "you're flying inside walls" cue scales with how many
 *  rails the rays of perspective can catch on. */
export const RAIL_COUNT_PER_LEG = 20;

/** Dot counts per rail. Partial rails end midway through the leg
 *  so the shell never closes off into a cage. Bumped 32/16 -> 42/22
 *  (same pass) so each rail reads as a continuous receding line of
 *  dots rather than a sparse scatter, which is the strongest cue
 *  the visitor is inside a long tube. */
const FULL_RAIL_DOTS = 42;
const PARTIAL_RAIL_DOTS = 22;

/** Cross-ring depth slices per leg. A full 360° dotted oval at each
 *  slice gives the shell visible CROSS-SECTIONS the camera flies
 *  through — the strongest "concentric rings receding into a
 *  tunnel" cue (the visual the 1c5494c hemisphere-divergence walls
 *  achieved via left-only cross-rungs, now uniform around the
 *  whole shell so it reads as a unified wormhole, not a split
 *  metaphor). */
const CROSS_RING_COUNT_PER_LEG = 6;
/** Dots around each cross-ring's oval perimeter. 32 reads as a
 *  smooth circle from afar but stays clearly dotted up close. */
const CROSS_RING_DOTS = 32;

/** Exit-mouth ring cadence (v3.12 aperture grammar).
 *
 *  The leg-2 exit is articulated as a sequence of clean dotted
 *  ellipse rings — same grammar as the cross-rings used elsewhere on
 *  the wormhole and the gimbal rings on the intelligence layer the
 *  corridor exits onto. The trick is the SPACING: rings are spaced
 *  with a geometric (power) compression toward the rim, so as the
 *  camera dollies into them the rhythm of rings passing perceptibly
 *  accelerates. That accelerating cadence — not particle density —
 *  is what reads as "exit approaching".
 *
 *  Versus v3.11:
 *    - Petal modulation + radial ribs removed. The 8-petal flower
 *      shape was organic and fought the precision-instrument grammar
 *      of the gimbal rings the user is travelling toward; rings now
 *      stay perfect ellipses.
 *    - Ring count trimmed (7 → 6) and rim dot count clamped (88 → 64)
 *      so the rim ring reads as a hero pearl-string, not a dense
 *      mass. Density still grades from throat to rim, but quietly.
 *    - Cadence exponent (`Z_CADENCE_POWER = 1.7`) replaces linear
 *      ring spacing. Inner rings sit further apart, outer rings
 *      cluster toward the rim — the runway-approach-light rhythm.
 *    - Palette discipline: dawn-soft → dawn ramp only. Gold mix
 *      capped at the absolute rim and very small, since gold is
 *      the gyroscope's accent.
 *    - `aMouth` strength curve unchanged so the existing
 *      `uExitWarp` trumpet-bell splay still drives the mouth's
 *      flare during the passthrough.
 *
 *  Yield: rings (`aReveal == 2`) are multiplied by `getMouthYieldFade`
 *  in the useFrame so they clear before the Build park (~0.923),
 *  leaving the stage for the gyroscope. The `<ExitGlow>` quad
 *  persists as a low residual backlight. */
const EXIT_MOUTH_RING_COUNT = 6;
const EXIT_MOUTH_DOTS_MIN = 22;
const EXIT_MOUTH_DOTS_MAX = 64;
const EXIT_MOUTH_START_FRAC = 0.62;
const EXIT_MOUTH_END_FRAC = 0.995;
/** Geometric ring-spacing exponent. Z position along the leg is
 *  `lerp(start, end, ringT^POWER)` with ringT = i/(N-1). POWER > 1
 *  pushes successive rings toward the rim, so the stack reads as
 *  inner rings widely spaced with a tightening cadence approaching
 *  the mouth — accelerating runway lights, not even-spaced ladder. */
const EXIT_MOUTH_Z_CADENCE_POWER = 1.7;
const EXIT_MOUTH_DEPTH_BLOOM = 0.18;

/** Exit acceleration field (v3.6).
 *
 *  Short directional streaks along the inner surface of the leg-2
 *  tunnel that read as "light streaming past you" as the camera
 *  approaches the Build mouth. The streaks are static line segments
 *  in world space; the perceived motion comes from camera dolly +
 *  per-streak opacity ramping with `uExitWarp`.
 *
 *  Designed to NOT pile up at the rim: each streak has its own
 *  `streamStrength` gradient eased by its leg-local Z, so they begin
 *  faint and short well inside the tunnel and accumulate density +
 *  length toward the mouth. This is what gives the sensation of
 *  inward acceleration rather than a rim-only halo.
 *
 *  Cheap by construction — a few hundred line segments, no per-frame
 *  vertex shuffling. */
const STREAK_COUNT = 520;
/** Min/max base length along Z. Min applies at the inner (camera-side)
 *  end of the field; max applies at the mouth end. Bumped 0.7/3.2 ->
 *  1.4/3.6 (v3.8) so near streaks read as light-speed lines when they
 *  pass the camera while far streaks stay modest. */
const STREAK_LENGTH_MIN = 1.4;
const STREAK_LENGTH_MAX = 3.6;
/** Leg-local Z fractions across which the streak field lives. Starts
 *  earlier than `EXIT_MOUTH_START_FRAC` so streaks are already present
 *  while leaving Encode (faintly), then builds density toward the
 *  mouth. */
const STREAK_START_FRAC = 0.42;
const STREAK_END_FRAC = 0.93;
/** Inner radius factor — streaks sit slightly INSIDE the shell so they
 *  read as the inner-surface flow, not as the outer wall. 0.86 puts
 *  them visibly inboard of the dotted shell so they don't merge with
 *  the existing rail dots. */
const STREAK_INNER_RADIUS = 0.86;
/** Per-streak radial flare amount under full warp (fraction of the
 *  shell radius). Small — the streaks should mostly read as axial. */
const STREAK_RADIAL_FLARE = 0.22;

/** Exit funnel field (RETIRED in v3.12).
 *
 *  Three rounds of v3.9 → v3.11 polish (volumetric particle field
 *  spread across the leg-2 shell with density / radial / lobe
 *  gradients) could not fully calm the noise floor it created
 *  around the foreground gyroscope. The articulation strategy was
 *  density (dust); the reference-aligned articulation is structure
 *  (rings) plus light (the new `<ExitGlow>` quad). The mouth-bloom
 *  ring cadence above + the exit glow below replace the field
 *  entirely. ~3,200 additive points removed from the leg-2 budget
 *  at the moment of heaviest overdraw. See ADR-018 (v3.12 aperture
 *  grammar) for the full rationale. */

/** Aperture depth-gate frames per leg. */
const APERTURE_FRAMES_PER_LEG = 3;
/** Dots along each corner's two short arms. */
const APERTURE_ARM_DOTS = 5;
/** Dots along the dashed edge segments between corners (per side).
 *  Used to give the aperture a clear rectangular outline read while
 *  the corner anchors still carry the gold-accent registration. */
const APERTURE_EDGE_DOTS = 6;

/** Topographic shelf rows per leg + dots per row. */
const SHELF_ROW_COUNT = 3;
const SHELF_Z_SLICES = 5;
const SHELF_X_SAMPLES = 8;

// ── Exit glow (v3.12 aperture grammar) ──────────────────────────

/** Half-extent (world units) of the exit-glow plane. v3.12c: grown
 *  3.0 → 4.0 AND the disc dropped slightly below the axis (see
 *  `EXIT_GLOW_Y_DROP`) — at 3.0 centred on the sphere the peak read
 *  as "the centre of the sphere lights up". Larger + lower, the
 *  same luminance spreads into an ambient wash sitting on the
 *  valley horizon behind the artifact's lower limb. */
const EXIT_GLOW_HALF = 4.0;

/** World-Z offset BEHIND the leg-2 mouth end (more negative Z). The
 *  glow sits past the rim ring but in front of the deep starfield,
 *  reading as an ambient light source the corridor opens onto. The
 *  brandmark-followed gyroscope sits in front of the glow at the
 *  Build park, so the residual glow naturally backlights it. */
const EXIT_GLOW_Z_BEHIND_MOUTH = 0.6;

/** Vertical drop of the glow disc below the optical axis (v3.12c).
 *  Centres the warm core behind the sphere's LOWER limb / the
 *  substrate-valley horizon instead of dead-centre behind the
 *  brandmark — backlight, not a lit bulb inside the artifact. */
const EXIT_GLOW_Y_DROP = -0.55;

/** Peak alpha at full envelope. Quiet by design — the glow is the
 *  ambient light source, not a bright object. v3.12c trimmed
 *  0.55 → 0.38: the threshold WAVE carries the exit event now;
 *  the glow is only the warm key behind it. */
const EXIT_GLOW_PEAK_OPACITY = 0.38;

/** Inner / outer colours of the glow's two-stage radial gradient.
 *  Inner is brand gold (the same hue the rim ring tints toward, so
 *  the glow / ring / gyroscope share one warm key); outer is a dim
 *  warm bath that fades into the void. */
const EXIT_GLOW_INNER_COLOR = new THREE.Color("#caa554");
const EXIT_GLOW_OUTER_COLOR = new THREE.Color(0.34, 0.24, 0.13);

// ── Visibility constants ────────────────────────────────────────

/** Camera-space distance band where wall points are visible. Wider
 *  than the latent field's because rails span more world Z and
 *  should fade in gently as they approach. */
export const VISIBLE_NEAR = 0.6;
export const VISIBLE_FAR = 22;

/** Far-fade EXTENSION for high-`aMouth` exit-mouth ring particles
 *  (v3.12 — was `funnel points`).
 *
 *  The leg-2 mouth sits ~24+ world units from the Navigate park, well
 *  outside `VISIBLE_FAR = 22` for ordinary rail dots. We push the
 *  visible far for mouth-channel points further out so the rim ring
 *  resolves as a faint silhouette at the end of the corridor when
 *  the user parks at Navigate, anchored by the always-on `<ExitGlow>`
 *  behind it. Atmospheric perspective, not progress-keyed pop-in.
 *  Scaled by `aMouth` in the shader so ordinary rail dots keep their
 *  original visible band; only the rim-loaded ring points reach. */
const VISIBLE_FAR_MOUTH_EXTENSION = 11;
/** Distance at which the long-range mouth glow caps its alpha. Stays
 *  subtle so the rim ring never competes with the foreground
 *  gyroscope. The exit glow quad does the heavy "light at end of
 *  tunnel" work; the rings are the structural read on top of that
 *  light. */
const MOUTH_LONGRANGE_ALPHA_CAP = 0.26;

/** Reveal envelopes per leg, in global progress units.
 *
 *  Leg 1 lifts AFTER the opening Thoughtform park (centre ~0.06),
 *  resolving early in the entry flythrough so the wormhole is already
 *  wrapping you as you fly toward Navigate.
 *
 *  Leg 2 reveal was pulled EARLIER (2026-06-04): it now resolves
 *  BEFORE the Diagnostic/Encode park (0.60) instead of after it.
 *  Previously leg 2 only lifted at 0.63–0.77, so as you scrolled past
 *  Encode the leg-1 rails had already slid behind the camera while
 *  leg 2 hadn't appeared yet — the corridor walls visibly vanished
 *  for a beat. Revealing leg 2 by ~0.57 (combined with the
 *  continuous leg spans below) keeps the left/right rails present the
 *  whole way through, including across the Encode park. */
export const LEG_1_REVEAL_START = 0.12;
export const LEG_1_REVEAL_END = 0.24;
export const LEG_2_REVEAL_START = 0.46;
export const LEG_2_REVEAL_END = 0.57;

/** Exit-mouth ring reveal window (v3.12 — was `funnel + mouth-bloom`).
 *  Distinct from `LEG_2_REVEAL_*` (which gates the leg-2 RAILS — the
 *  lattice the camera flies INSIDE) so the rim ring's silhouette
 *  resolves EARLY, not at the moment the camera arrives. Ramps on as
 *  the user leaves Thoughtform, so by the Navigate park (~0.40) the
 *  rim ring is faintly readable in front of the always-on
 *  `<ExitGlow>` quad. The shell-wall structure stays gated by
 *  `LEG_2_REVEAL_*` and the far-fade clamp.
 *
 *  Multiplied by `getMouthYieldFade` per frame in `useFrame` so the
 *  rings clear before the Build park (the `<ExitGlow>` keeps a low
 *  residual past it as the gyroscope's backlight). */
const MOUTH_REVEAL_START = 0.16;
const MOUTH_REVEAL_END = 0.32;

/** Leg span fractions: rails START just past the source gate and END
 *  just before the destination gate. Tightened toward the gates
 *  (2026-06-04: start 0.12 → 0.06, end 0.94 → 0.99) so leg 1 and
 *  leg 2 very nearly meet at the Diagnostic gate — the residual gap
 *  (~0.7 world units) sits right at the orbit diagram and is masked
 *  by it, so the rail shell reads as ONE continuous tube from the
 *  entry flythrough all the way to the substrate instead of two
 *  disconnected segments with a hole at Encode. */
export const LEG_RAIL_START_FRAC = 0.06;
export const LEG_RAIL_END_FRAC = 0.99;

// ── Shaders ─────────────────────────────────────────────────────

const wallsVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uVisibleFarMouthExtension;
uniform float uMouthLongRangeAlphaCap;
uniform float uReveal1;
uniform float uReveal2;
// v3.11 wormhole-exit funnel reveal channel — distinct from the
// leg-2 rail reveal so the mouth glow appears EARLY (as the camera
// leaves Thoughtform) instead of at the moment the leg-2 rails
// arrive. aReveal selects: 0 = leg 1 rails, 1 = leg 2 rails,
// 2 = leg 2 funnel + mouth-bloom particles.
uniform float uRevealMouth;
// v3.2 wormhole-exit warp: ramps 0->1 across the late corridor as
// the camera approaches the Build park. At peak the rails splay
// radially OUTWARD from the tube's optical axis, with stronger
// expansion near + ahead of the camera — reads as flying out of
// the mouth of the tube. The shader does no work when uExitWarp
// is 0, so the corridor's earlier passes are byte-identical.
uniform float uExitWarp;

attribute vec3 aColor;
attribute float aReveal;
attribute float aSize;
attribute float aMouth;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Wormhole-exit MOUTH widen (v3.3). The tube is centred on the world
  // Z axis (corridor optical axis), so each point's radial direction is
  // just (x, y) in world space. As we approach Build we dilate the tube
  // AHEAD of the camera so its far end flares open like a trumpet bell /
  // iris — we fly THROUGH a widening mouth into the new space. Points at
  // or behind the camera keep their radius (we've already passed them),
  // so the throat stays tight and only the opening ahead spreads — this
  // reads as the corridor opening up, not as the whole shell ballooning
  // into a flat ring (the v3.2 near-camera blowout).
  vec3 worldPos = position;
  if (uExitWarp > 0.0) {
    // ahead > 0 for points DEEPER down the corridor than the camera
    // (more negative Z); 0 for points at / behind the camera.
    float ahead = max(0.0, uCameraPos.z - position.z);
    // Mouth opening grows with distance ahead but saturates, so the far
    // rim flares wide while the throat right in front of us stays
    // tighter — the bell shape. 4-unit decay so the flare ramps up
    // within the near visible span (more of the tube ahead reads as
    // opening rather than only the far rim).
    float mouth = 1.0 - exp(-ahead / 4.0);
    // Magnitude 1.9 (up from 1.3): the far rim roughly triples its
    // radius at full warp so the opening is unmistakable as you fly
    // toward it, while the forward bias keeps the throat — and thus the
    // frame — clear (no v3.2-style flat-ring blowout at the camera).
    // Graded mouth particles (aMouth 0..1) act like the same tunnel
    // material getting denser toward the rim. Only the rim opens harder;
    // throat particles stay close to the ordinary rail warp so the
    // mouth reads as part of the tube, not a detached particle cloud.
    float rim = smoothstep(0.18, 1.0, aMouth);
    float expand = uExitWarp * mouth * mix(1.9, 2.75, rim);
    worldPos.xy *= 1.0 + expand;
  }

  vec4 mv = modelViewMatrix * vec4(worldPos, 1.0);
  float dist = distance(worldPos, uCameraPos);

  // Per-point reveal channel selection (v3.11):
  //   aReveal == 0  → leg 1 rails (uReveal1)
  //   aReveal == 1  → leg 2 rails (uReveal2)
  //   aReveal == 2  → leg 2 funnel + mouth bloom (uRevealMouth)
  // The early-ramping mouth channel makes the door at the end of the
  // corridor appear as a faint glow as the user leaves Thoughtform,
  // long before the leg-2 rail lattice itself fades in.
  float reveal;
  if (aReveal > 1.5) {
    reveal = uRevealMouth;
  } else {
    reveal = mix(uReveal1, uReveal2, aReveal);
  }

  // Camera-space depth focus. Walls behind the camera or beyond the
  // far plane vanish; rails ahead fade in as they approach.
  // Extend the far visibility for high-aMouth points (the funnel +
  // mouth bloom) so the glow remains visible from the Navigate park
  // ~24+ world units away, with a long-range alpha cap so it stays
  // subtle and never competes with the foreground gimbal sphere.
  float visibleFar = uVisibleFar + aMouth * uVisibleFarMouthExtension;
  float farFade = smoothstep(visibleFar, visibleFar - 5.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 1.2, dist);
  // Extra gentle damping for high-aMouth points sitting beyond the
  // ordinary far plane — they read as a quiet warm presence at
  // distance instead of a bright cluster, while close-up funnel
  // dots keep their full alpha.
  float longRangeT = smoothstep(uVisibleFar, uVisibleFar + 8.0, dist);
  float longRangeDamp = mix(1.0, uMouthLongRangeAlphaCap, longRangeT * aMouth);

  gl_Position = projectionMatrix * mv;

  vColor = aColor;
  // aMouth is a density/strength gradient. Low mouth values sit slightly
  // quieter than the ordinary rails; only the rim gains brightness as it
  // opens. This removes the "floating cloud at the edge" read.
  // Polish round 2 (2026-06-10): mix(0.78, 1.28) -> mix(0.72, 1.05)
  // so the mouth peak no longer brightens above ordinary rail
  // values — the gradient still reads (low end is quieter, rim is
  // marginally brighter) but the mouth never visually clashes with
  // the foreground gimbal sphere even at peak warp.
  float mouthAlpha = mix(0.72, 1.05, smoothstep(0.08, 1.0, aMouth) * uExitWarp);
  // v3.8 side-wall densify: leg-2 wall dots gain a small alpha lift
  // during the exit warp so the corridors flanking the gyroscope
  // sphere read as denser walls as you exit the wormhole. aReveal
  // is 0 for leg 1 and 1 for leg 2, so this only affects the
  // Encode->Build leg. aMouth particles already have their own
  // mouthAlpha curve, so we skip those (1 - aMouth) to avoid stacking.
  // Funnel particles (aReveal == 2) are excluded from this lift so the
  // long-range glow stays balanced.
  float legRailMask = step(0.5, aReveal) * (1.0 - step(1.5, aReveal));
  float exitWallLift = mix(1.0, 1.3, uExitWarp * legRailMask * (1.0 - aMouth));
  vAlpha = reveal * farFade * nearFade * longRangeDamp * mix(1.0, mouthAlpha, aMouth) * exitWallLift;

  // Distance-based size with a generous floor so far rails still
  // resolve as individual dots, not pixel dust.
  float sizeFactor = clamp(7.0 / max(0.5, dist), 0.55, 2.6);
  // Funnel particles (aReveal == 2) shrink slightly at long range so
  // density carries the read of the distant glow rather than a few
  // big blobs — the butter-spread reads as fine dust, not chunks.
  float funnelMask = step(1.5, aReveal);
  float funnelLongRangeShrink = 1.0 - funnelMask * smoothstep(uVisibleFar, uVisibleFar + 8.0, dist) * 0.4;
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * aSize * mix(1.0, 1.16, aMouth) * funnelLongRangeShrink;
}
`;

const wallsFragment = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Soft round dots. No halo — keeps the lattice crisp.
  float core = smoothstep(0.5, 0.0, d);
  float alpha = core * vAlpha * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// ── Streak shaders (v3.6 acceleration field) ─────────────────────
//
// Lightweight per-vertex shader for the inner-surface line streaks.
// Each line is two vertices in the geometry; both carry the same
// `aStreamStrength` (0..1 leg-local rim weight). The shader uses
// `uExitWarp` to brighten/extend streaks toward the mouth — at low
// warp they're effectively invisible, at peak warp the closest
// streaks read as warp-speed flow past the camera.

const streakVertex = /* glsl */ `
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uExitWarp;

attribute float aStreamStrength;
attribute float aEnd;   // 0 at the tail (near camera), 1 at the head (far)
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);

  // Camera-space depth focus — same envelope as the dotted walls so
  // streaks fade in/out symmetrically with the surrounding shell.
  float farFade = smoothstep(uVisibleFar, uVisibleFar - 5.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 0.6, dist);

  // v3.8 camera-passing-band reveal. Brightness is driven by HOW CLOSE
  // each streak is to passing the camera (a perspective-foreshortened
  // line just to the side of the camera reads as a long bright streak;
  // a streak deep down the tunnel projects to a small central patch
  // hidden by the gyroscope sphere). ahead > 0 means the streak is
  // in front of the camera in world space (more negative Z). The
  // passing band peaks for streaks just ahead of the camera and falls
  // off at ~9 units; a faint farHint keeps the deep-tunnel streaks
  // visible as anticipation. aStreamStrength is now a per-streak
  // VARIETY hash (0.55..1.0), not a rim weight, so neighbouring
  // streaks differ in intensity without a spatial gradient that would
  // again hide the near-camera flow.
  float ahead = uCameraPos.z - position.z;
  float passBand =
      (1.0 - smoothstep(4.0, 9.0, ahead)) * smoothstep(-1.0, 0.3, ahead);
  float farHint = 0.22 * (1.0 - passBand);
  float streamReveal = (passBand + farHint) * aStreamStrength * uExitWarp;
  float tailFade = mix(1.0, 0.35, aEnd);

  gl_Position = projectionMatrix * mv;
  vColor = aColor;
  vAlpha = streamReveal * farFade * nearFade * tailFade;
}
`;

const streakFragment = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float alpha = vAlpha * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// ── Exit-glow shaders (v3.12 aperture grammar) ───────────────────
//
// A single quad seated just past the leg-2 mouth Z. Two-stage radial
// gradient — bright warm core, soft cool halo — same pattern the
// boot-glow disk uses behind the Thoughtform compass (see
// `bootGlowFragmentShader` in `ThoughtformAtmosphere.tsx`). Reads as
// "the corridor opens onto a light source": at distance it's a tiny
// promise of light; up close it bathes the mouth + gyroscope in
// warm fill. Additive blending so the gyro silhouette gains a
// physical-feeling backlight rim where the two overlap.

const exitGlowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const exitGlowFragment = /* glsl */ `
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  // Radial distance from disk centre (0 at centre, 1 at edge).
  vec2 centred = vUv - 0.5;
  float d = length(centred) * 2.0;
  if (d >= 1.0) discard;
  // Two-stage falloff: a tight bright core surrounded by a wider
  // soft halo so the glow reads as a luminous source bathing the
  // surrounding void in light, not as a flat tinted disk. The
  // halo extends to the disk edge before clipping; the core is
  // concentrated within the inner ~half of the radius.
  float core = smoothstep(0.55, 0.0, d);
  float halo = smoothstep(1.0, 0.18, d);
  vec3 color = mix(uOuterColor, uInnerColor, core);
  float alpha = mix(halo * 0.45, 1.0, core) * uOpacity;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

// ── Geometry builders ───────────────────────────────────────────

interface PointBuffers {
  positions: number[];
  colors: number[];
  reveals: number[];
  sizes: number[];
  mouths: number[];
}

/** Per-streak vertex buffers. Two vertices per streak (tail + head);
 *  the line list draws them as line segments. */
interface StreakBuffers {
  positions: number[];
  colors: number[];
  strengths: number[];
  ends: number[]; // 0 at tail, 1 at head
}

// (Epilogue landscape morph removed in v3 — the substrate sphere now
//  becomes a planet we land on; the corridor topology stays as the
//  space we fly through and recedes naturally as the camera flies in.)

function pushPoint(
  buf: PointBuffers,
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
  reveal: number,
  size: number,
  mouth = 0
): void {
  buf.positions.push(x, y, z);
  buf.colors.push(color.r, color.g, color.b);
  buf.reveals.push(reveal);
  buf.sizes.push(size);
  buf.mouths.push(mouth);
}

/** Per-leg Z endpoints. Public sampler `sampleRailPoint` reuses these
 *  so the photon comets ride the same dotted rails the walls paint —
 *  no separate path geometry, no drift between rail and comet. */
export function getLegRailRange(legIdx: 0 | 1): { fromZ: number; toZ: number } {
  const tfZ = STATION_THOUGHTFORM.position[2];
  const dgZ = STATION_DIAGNOSTIC.position[2];
  const intZ = STATION_INTELLIGENCE.position[2];
  if (legIdx === 0) {
    return {
      fromZ: lerp(tfZ, dgZ, LEG_RAIL_START_FRAC),
      toZ: lerp(tfZ, dgZ, LEG_RAIL_END_FRAC),
    };
  }
  return {
    fromZ: lerp(dgZ, intZ, LEG_RAIL_START_FRAC),
    toZ: lerp(dgZ, intZ, LEG_RAIL_END_FRAC),
  };
}

/** World-Z position of the exit-glow plane (v3.12). Sits
 *  `EXIT_GLOW_Z_BEHIND_MOUTH` units past the leg-2 mouth end,
 *  which is itself `EXIT_MOUTH_END_FRAC` of the leg span past the
 *  Diagnostic station. The result is a fixed-world position the
 *  camera physically approaches, so the disk shrinks under
 *  perspective at distance and grows at the Build park — no
 *  progress-keyed scaling needed. */
function getExitGlowZ(): number {
  const { fromZ, toZ } = getLegRailRange(1);
  const span = toZ - fromZ;
  const mouthEndZ = fromZ + span * EXIT_MOUTH_END_FRAC;
  return mouthEndZ - EXIT_GLOW_Z_BEHIND_MOUTH;
}

/** Sample a world position along a specific rail at fractional `t`
 *  in [0, 1]. Mirrors the geometry produced by `buildLegRails`:
 *  even angular distribution per leg with the per-leg phase offset,
 *  oval cross-section, inward perspective pull along Z. Used by
 *  `CorridorPhotons` so the photon comets travel the visible rails
 *  exactly. */
export function sampleRailPoint(
  legIdx: 0 | 1,
  railIdx: number,
  t: number
): { x: number; y: number; z: number } {
  const angle = (railIdx / RAIL_COUNT_PER_LEG) * Math.PI * 2 + legIdx * 0.18;
  const baseX = Math.cos(angle) * SHELL_RX;
  const baseY = Math.sin(angle) * SHELL_RY;
  const { fromZ, toZ } = getLegRailRange(legIdx);
  const z = lerp(fromZ, toZ, t);
  const inward = 1 - t * RAIL_INWARD_PULL;
  return { x: baseX * inward, y: baseY * inward, z };
}

/** Build the longitudinal dotted rails around the oval shell for one
 *  leg. Rails are deterministically distributed around the full 360°
 *  so the user is enclosed by the lattice; alternating full/partial
 *  rails plus a colour mix prevent the shell from reading as a
 *  perfect cage. */
function buildLegRails(fromZ: number, toZ: number, legIdx: 0 | 1, buf: PointBuffers): void {
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);

  for (let i = 0; i < RAIL_COUNT_PER_LEG; i++) {
    // Even angular distribution around the shell with a per-leg
    // phase offset so the two legs don't have rails at identical
    // angles — keeps the second wormhole visually distinct from
    // the first.
    const angle = (i / RAIL_COUNT_PER_LEG) * Math.PI * 2 + legIdx * 0.18;
    const baseX = Math.cos(angle) * SHELL_RX;
    const baseY = Math.sin(angle) * SHELL_RY;

    // Every third rail is "partial" — ends midway through the leg.
    // Mix gold sparingly: only on the cardinal-ish rails.
    const isFull = i % 3 !== 2;
    const dotCount = isFull ? FULL_RAIL_DOTS : PARTIAL_RAIL_DOTS;
    const railEndZ = isFull ? toZ : lerp(fromZ, toZ, 0.55);

    // Color tiering: a quarter of the rails read in dawn (brighter),
    // the rest in dawn-soft. Keeps the lattice palette quiet.
    const railColor = i % 4 === 0 ? dawn : dawnSoft;
    const railSize = isFull ? 1.0 : 0.85;

    for (let d = 0; d < dotCount; d++) {
      const t = dotCount > 1 ? d / (dotCount - 1) : 0;
      const z = lerp(fromZ, railEndZ, t);
      // Inward perspective pull at far end — small but cumulative
      // across many rails it makes the shell visibly converge.
      const inward = 1 - t * RAIL_INWARD_PULL;
      pushPoint(buf, baseX * inward, baseY * inward, z, railColor, legIdx, railSize);
    }
  }
}

/** Build one depth-gate aperture frame — four gold corner anchors
 *  with short inward arms, a dashed rectangular outline between
 *  them, and a mid-edge tick on top + bottom only. Reads as a
 *  rectangular station the camera passes through. */
function buildAperture(
  centreZ: number,
  halfX: number,
  halfY: number,
  legIdx: 0 | 1,
  buf: PointBuffers
): void {
  const gold = new THREE.Color(GOLD_HEX);
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);

  const corners: [number, number][] = [
    [-halfX, -halfY],
    [halfX, -halfY],
    [halfX, halfY],
    [-halfX, halfY],
  ];
  const armLength = 0.22;

  for (const [cx, cy] of corners) {
    // Corner anchor — gold accent.
    pushPoint(buf, cx, cy, centreZ, gold, legIdx, 1.3);

    // Inward arms — short horizontal + short vertical dotted runs.
    const dirX = -Math.sign(cx);
    const dirY = -Math.sign(cy);
    for (let k = 1; k <= APERTURE_ARM_DOTS; k++) {
      const t = k / APERTURE_ARM_DOTS;
      pushPoint(buf, cx + dirX * armLength * t, cy, centreZ, dawn, legIdx, 0.95);
      pushPoint(buf, cx, cy + dirY * armLength * t, centreZ, dawn, legIdx, 0.95);
    }
  }

  // Dashed rectangular outline — interior edge dots between the
  // corner anchors. Skip the endpoint slots (corners already own
  // those) and the slot adjacent to the corner (the inward arms
  // already populate that). This leaves a sparse interior dash
  // pattern that closes the rectangle without making it feel
  // solid.
  for (let side = 0; side < 4; side++) {
    const [ax, ay] = corners[side];
    const [bx, by] = corners[(side + 1) % 4];
    for (let k = 2; k <= APERTURE_EDGE_DOTS; k++) {
      const t = k / (APERTURE_EDGE_DOTS + 2);
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      pushPoint(buf, x, y, centreZ, dawnSoft, legIdx, 0.85);
    }
  }

  // Mid-edge accent ticks — top + bottom only. Sides are left clear
  // so the HUD rails (which sit at the viewport extremes) don't
  // fight the aperture for the eye.
  pushPoint(buf, 0, halfY, centreZ, dawn, legIdx, 1.0);
  pushPoint(buf, 0, -halfY, centreZ, dawn, legIdx, 1.0);
}

/** Build full 360° cross-section rings around the wormhole shell at
 *  evenly-spaced Z slices through the leg. Each ring is a dotted
 *  oval at the SHELL_RX/SHELL_RY cross-section (with the same inward
 *  perspective pull as the longitudinal rails so the rings sit flush
 *  on the shell as it converges).
 *
 *  This is the single strongest "you are inside a tunnel" cue — when
 *  the camera flies along Z it passes THROUGH the rings, and from
 *  off-centre the rings read as the prominent concentric arcs on the
 *  left and right walls of the wormhole. Restored 2026-06-05 as a
 *  uniform replacement for the retired hemisphere-divergence
 *  cross-rungs (see ADR-018 wall-presence revision). */
function buildCrossRings(fromZ: number, toZ: number, legIdx: 0 | 1, buf: PointBuffers): void {
  // Alternating dawn / gold / dawn-soft so successive rings don't
  // collapse into one uniform colour — keeps the ring stack reading
  // as a layered chart rather than monotone shells.
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  const gold = new THREE.Color(GOLD_HEX);
  const ringColors = [dawn, dawnSoft, gold];

  for (let s = 0; s < CROSS_RING_COUNT_PER_LEG; s++) {
    // Spread rings evenly through the interior of the leg span,
    // skipping the very start/end so they don't crowd the gate
    // geometry at the leg boundaries.
    const zT = (s + 1) / (CROSS_RING_COUNT_PER_LEG + 1);
    const z = lerp(fromZ, toZ, zT);
    const inward = 1 - zT * RAIL_INWARD_PULL;
    const rx = SHELL_RX * inward;
    const ry = SHELL_RY * inward;
    const color = ringColors[(s + legIdx) % ringColors.length];
    // Slightly smaller dot size on the rings than on the rails so the
    // rails still read as the primary structure and the rings as
    // depth annotations layered on top.
    const dotSize = 0.85;

    for (let d = 0; d < CROSS_RING_DOTS; d++) {
      const angle = (d / CROSS_RING_DOTS) * Math.PI * 2 + legIdx * 0.07;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      pushPoint(buf, x, y, z, color, legIdx, dotSize);
    }
  }
}

/** Build the exit-mouth ring cadence at the end of leg 2 (Encode →
 *  Build). v3.12 aperture grammar: structure (rings) + light (the
 *  separate `<ExitGlow>` quad), no density dust.
 *
 *  Rings are clean dotted ellipses spaced with a geometric Z
 *  compression toward the rim (`EXIT_MOUTH_Z_CADENCE_POWER`). As the
 *  camera dollies into them the rhythm of rings passing perceptibly
 *  accelerates — that cadence, not particle mass, communicates "exit
 *  approaching". The grammar rhymes with the cross-rings elsewhere on
 *  the wormhole and with the gimbal rings of the intelligence layer
 *  the corridor exits onto.
 *
 *  Per ring we still grade dot count / size / colour / `aMouth`
 *  strength toward the rim so the outermost ring reads as the hero
 *  pearl-string and the inner rings read as anticipation. The
 *  trumpet-bell flare under `uExitWarp` (high-`aMouth` rim particles
 *  splay outward) is unchanged from earlier versions — the rebuild
 *  is about WHAT carries the static read, not the warp dynamics. */
function buildExitMouthBloom(fromZ: number, toZ: number, buf: PointBuffers): void {
  const gold = new THREE.Color(GOLD_HEX);
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  const span = toZ - fromZ;

  for (let r = 0; r < EXIT_MOUTH_RING_COUNT; r++) {
    const ringT = EXIT_MOUTH_RING_COUNT > 1 ? r / (EXIT_MOUTH_RING_COUNT - 1) : 1;
    // Eased rim weight (0..1) drives count / size / colour / mouth
    // strength so the outermost ring reads as the rim mass.
    const rimT = ringT * ringT * (3 - 2 * ringT);
    // Geometric ring spacing — `ringT^POWER` (POWER > 1) pushes
    // successive rings toward the mouth end so the cadence
    // perceptibly accelerates as the camera approaches the rim.
    // This is the runway-approach-light rhythm: inner rings widely
    // spaced, outer rings clustered, the eye reads "something is
    // about to happen".
    const zPower = Math.pow(ringT, EXIT_MOUTH_Z_CADENCE_POWER);
    const zT = lerp(EXIT_MOUTH_START_FRAC, EXIT_MOUTH_END_FRAC, zPower);
    const z = fromZ + span * zT;

    // The mouth widens slightly toward the rim even before the
    // shader warp — early rings sit at the ordinary tunnel radius,
    // the rim ring sits a hair outside. The trumpet-bell splay
    // under `uExitWarp` then expands the rim much further.
    const depthBloom = 1 + rimT * EXIT_MOUTH_DEPTH_BLOOM;
    const inward = 1 - zT * RAIL_INWARD_PULL;
    const rx = SHELL_RX * inward * depthBloom;
    const ry = SHELL_RY * inward * depthBloom;

    // Palette discipline: dawn-soft → dawn ramp drives the inner
    // rings; the rim ring carries a small gold tint (capped at 0.25)
    // as a quiet rhyme with the gyroscope it reveals. NOT a hot
    // gold rim — gold is the gyroscope's accent and the mouth must
    // not compete with it.
    const ringColor = dawnSoft.clone().lerp(dawn, Math.min(1, rimT * 1.15));
    if (rimT > 0.7) {
      const goldT = ((rimT - 0.7) / 0.3) * 0.25;
      ringColor.lerp(gold, goldT);
    }

    const dotCount = Math.round(lerp(EXIT_MOUTH_DOTS_MIN, EXIT_MOUTH_DOTS_MAX, rimT));
    // `aMouth` is unchanged from earlier versions — the existing
    // shader's mouth-alpha curve and `uExitWarp` rim splay both
    // depend on it, and that machinery is still doing the right job.
    const mouthStrength = 0.08 + rimT * 0.92;
    // Per-ring angular phase offset so successive rings don't share
    // dot angles (otherwise the rings collapse into longitudinal
    // streaks under the trumpet-bell warp).
    const ringPhase = 0.18 + ringT * 0.31;

    for (let d = 0; d < dotCount; d++) {
      const angle = (d / dotCount) * Math.PI * 2 + ringPhase;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      // Size grades toward the rim ring so the hero pearl-string
      // reads as the densest, brightest band without needing extra
      // dot count.
      const size = 0.48 + rimT * 0.72;
      // aReveal = 2 → uses the early-ramping `uRevealMouth` channel
      // so the rim ring resolves at distance (Navigate park view),
      // not at point-blank range.
      pushPoint(buf, x, y, z, ringColor, 2, size, mouthStrength);
    }
  }
}

/** Build the inner-surface streak field for leg 2 (Encode -> Build).
 *
 *  Each streak is a short line segment on the inside of the tunnel
 *  shell, aligned mostly along the optical Z axis with a small radial
 *  flare. Streaks accumulate density and length toward the mouth via
 *  a deterministic distribution so the camera reads them as the
 *  tunnel "streaming past" as it accelerates into the exit.
 *
 *  The distribution is intentionally biased: more samples fall near
 *  the rim than the throat, but every streak still owns its OWN leg-
 *  local Z, so even leaving Encode you see a few faint streaks far
 *  ahead — the field BUILDS rather than appearing at the rim.
 *
 *  Static geometry. The "motion" comes from the camera dollying past
 *  the streaks while `uExitWarp` brightens them, not from per-frame
 *  position updates. */
function buildExitMouthStreaks(fromZ: number, toZ: number, buf: StreakBuffers): void {
  const gold = new THREE.Color(GOLD_HEX);
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  const span = toZ - fromZ;

  for (let i = 0; i < STREAK_COUNT; i++) {
    // v3.8 UNIFORM distribution along the exit span. The previous
    // rim-biased `Math.pow(u, 1.6)` clustered streaks at the mouth,
    // which in screen space sat directly behind the gyroscope sphere
    // and was therefore occluded. Spreading streaks evenly along the
    // exit span guarantees there are ALWAYS streaks in the camera's
    // passing band (which the shader now uses for brightness) as the
    // camera dollies forward — continuous warp-speed flow past the
    // side walls, not a one-shot bloom at the mouth.
    const u = (i + 0.5) / STREAK_COUNT;
    const zT = lerp(STREAK_START_FRAC, STREAK_END_FRAC, u);
    const tailZ = fromZ + span * zT;

    // `aStreamStrength` is now per-streak VARIETY (deterministic hash
    // 0.55..1.0), not a rim weight. Neighbouring streaks differ in
    // intensity without imposing a spatial gradient that would hide
    // the near-camera flow. The shader's passing-band term owns the
    // spatial brightness.
    const hash = Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453);
    const variety = 0.55 + 0.45 * (hash - Math.floor(hash));
    const streamStrength = variety;

    // Streak length scales gently with leg-Z: nearer streaks are
    // longer (the perspective-stretched warp-speed read at the side
    // walls), far-mouth streaks stay short so they don't pile up.
    const lenT = 1 - u; // 1 at the near (camera-side) end, 0 at the mouth
    const len = lerp(STREAK_LENGTH_MIN, STREAK_LENGTH_MAX, lenT);

    // Distribute streaks around the full oval cross-section with a
    // golden-angle phase so they don't collide with the rail angles.
    const phase = (i * 2.39996) % (Math.PI * 2);
    const inward = 1 - zT * RAIL_INWARD_PULL;
    const r = STREAK_INNER_RADIUS * inward;
    // Subtle radial flare — bell-shaped, max at the head so the streak
    // bows slightly outward away from the tunnel axis. Constant amount
    // across the field; the brightness gradient is owned by the shader.
    const flare = STREAK_RADIAL_FLARE * 0.6;

    const baseX = Math.cos(phase) * SHELL_RX * r;
    const baseY = Math.sin(phase) * SHELL_RY * r;

    // The HEAD of the streak sits FURTHER from the camera (deeper -Z
    // in our world axis). The TAIL is closer to the camera. So
    // tailZ is the camera-side end and headZ is the mouth-side end.
    const headZ = tailZ - len;

    const tailX = baseX;
    const tailY = baseY;
    const headX = baseX * (1 + flare);
    const headY = baseY * (1 + flare);

    // Colour tiering driven by the same per-streak variety hash so the
    // palette punctuation distributes evenly along the span (the prior
    // version concentrated gold at the rim). Most streaks dawn-soft, a
    // quarter dawn, ~1-in-12 gold.
    let color: THREE.Color;
    if (variety > 0.92) color = gold;
    else if (i % 4 === 0) color = dawn;
    else color = dawnSoft;

    // Push tail (aEnd=0)
    buf.positions.push(tailX, tailY, tailZ);
    buf.colors.push(color.r, color.g, color.b);
    buf.strengths.push(streamStrength);
    buf.ends.push(0);
    // Push head (aEnd=1)
    buf.positions.push(headX, headY, headZ);
    buf.colors.push(color.r, color.g, color.b);
    buf.strengths.push(streamStrength);
    buf.ends.push(1);
  }
}

/** Build the lower topographic shelves for one leg — a few rows of
 *  faintly waved dots below the optical axis. Reads as a latent
 *  floor receding into the corridor, mirroring the archived
 *  `pushTopographicFloor` recipe but using particle dots rather
 *  than literal landscape mesh. */
function buildShelves(fromZ: number, toZ: number, legIdx: 0 | 1, buf: PointBuffers): void {
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  for (let s = 0; s < SHELF_ROW_COUNT; s++) {
    const sT = SHELF_ROW_COUNT > 1 ? s / (SHELF_ROW_COUNT - 1) : 0;
    const y = -1.1 - sT * 0.25;
    const xExtent = 1.85 - sT * 0.15;

    for (let zi = 0; zi < SHELF_Z_SLICES; zi++) {
      const zT = (zi + 0.5) / SHELF_Z_SLICES;
      const baseZ = lerp(fromZ, toZ, zT);
      for (let xi = 0; xi < SHELF_X_SAMPLES; xi++) {
        const xT = SHELF_X_SAMPLES > 1 ? xi / (SHELF_X_SAMPLES - 1) : 0;
        const x = -xExtent + xT * 2 * xExtent;
        // Deterministic wave so the shelf reads as terrain, not a
        // perfectly ruled grid.
        const wave = Math.sin(x * 2.4 + baseZ * 1.7 + s * 1.3 + legIdx * 0.9) * 0.05;
        pushPoint(buf, x, y + wave, baseZ, dawnSoft, legIdx, 0.7);
      }
    }
  }
}

/** Assemble both legs into a single deterministic point buffer. */
function buildWormholeWalls(): {
  positions: Float32Array;
  colors: Float32Array;
  reveals: Float32Array;
  sizes: Float32Array;
  mouths: Float32Array;
} {
  const buf: PointBuffers = {
    positions: [],
    colors: [],
    reveals: [],
    sizes: [],
    mouths: [],
  };

  const tfZ = STATION_THOUGHTFORM.position[2];
  const dgZ = STATION_DIAGNOSTIC.position[2];
  const intZ = STATION_INTELLIGENCE.position[2];

  // Leg 1 — Thoughtform → Diagnostic.
  const leg1Start = lerp(tfZ, dgZ, LEG_RAIL_START_FRAC);
  const leg1End = lerp(tfZ, dgZ, LEG_RAIL_END_FRAC);
  buildLegRails(leg1Start, leg1End, 0, buf);
  buildCrossRings(leg1Start, leg1End, 0, buf);
  buildShelves(leg1Start, leg1End, 0, buf);
  for (let i = 0; i < APERTURE_FRAMES_PER_LEG; i++) {
    const t = (i + 1) / (APERTURE_FRAMES_PER_LEG + 1);
    const z = lerp(leg1Start, leg1End, t);
    // Apertures shrink as they recede so the camera reads a
    // perspective convergence — same vanishing-point hint as the
    // rail inward pull.
    const halfX = 1.95 - t * 0.45;
    const halfY = 1.2 - t * 0.32;
    buildAperture(z, halfX, halfY, 0, buf);
  }

  // Leg 2 — Diagnostic → Intelligence.
  const leg2Start = lerp(dgZ, intZ, LEG_RAIL_START_FRAC);
  const leg2End = lerp(dgZ, intZ, LEG_RAIL_END_FRAC);
  buildLegRails(leg2Start, leg2End, 1, buf);
  buildCrossRings(leg2Start, leg2End, 1, buf);
  buildExitMouthBloom(leg2Start, leg2End, buf);
  buildShelves(leg2Start, leg2End, 1, buf);
  for (let i = 0; i < APERTURE_FRAMES_PER_LEG; i++) {
    const t = (i + 1) / (APERTURE_FRAMES_PER_LEG + 1);
    const z = lerp(leg2Start, leg2End, t);
    const halfX = 1.95 - t * 0.45;
    const halfY = 1.2 - t * 0.32;
    buildAperture(z, halfX, halfY, 1, buf);
  }

  return {
    positions: new Float32Array(buf.positions),
    colors: new Float32Array(buf.colors),
    reveals: new Float32Array(buf.reveals),
    sizes: new Float32Array(buf.sizes),
    mouths: new Float32Array(buf.mouths),
  };
}

/** Build the leg-2 streak field as a separate set of buffers for the
 *  `<lineSegments>` mount. Kept independent so the streaks can use a
 *  dedicated material/shader without inflating the points-shader
 *  vertex throughput. */
function buildWormholeStreaks(): {
  positions: Float32Array;
  colors: Float32Array;
  strengths: Float32Array;
  ends: Float32Array;
} {
  const buf: StreakBuffers = {
    positions: [],
    colors: [],
    strengths: [],
    ends: [],
  };

  const dgZ = STATION_DIAGNOSTIC.position[2];
  const intZ = STATION_INTELLIGENCE.position[2];
  const leg2Start = lerp(dgZ, intZ, LEG_RAIL_START_FRAC);
  const leg2End = lerp(dgZ, intZ, LEG_RAIL_END_FRAC);

  buildExitMouthStreaks(leg2Start, leg2End, buf);

  return {
    positions: new Float32Array(buf.positions),
    colors: new Float32Array(buf.colors),
    strengths: new Float32Array(buf.strengths),
    ends: new Float32Array(buf.ends),
  };
}

// ── Component ───────────────────────────────────────────────────

/** Baseline material opacity once a leg has fully revealed. Tuned so
 *  the rail lattice reads as architecture during travel (centre-of-
 *  dot final alpha ≈ 0.42 after the soft-disk falloff) while still
 *  feeling quiet enough that the gate diagrams + brandmark stay the
 *  dominant centre of attention. */
const OPACITY_BASE = 0.84;
/** Maximum opacity lift from scroll velocity. Small — base already
 *  reads architecturally; this just sharpens the lattice during
 *  active flight without flashing the walls bright. */
const OPACITY_VELOCITY_LIFT_MAX = 0.16;
/** How quickly the opacity tracks the target (smoothing factor). */
const OPACITY_RESPONSE = 5;

export function LatentWormholeWalls() {
  const pointsRef = useRef<THREE.Points>(null);
  const opacityRef = useRef<number>(0);
  // v3.9 — smoothed velocity factor for the line streaks. Light
  // streaks only make sense while travelling fast, so the streak
  // layer is gated by actual scroll velocity (the dotted funnel field
  // owns the always-present structural read). Damped so the streaks
  // ease in/out rather than strobing with each scroll event.
  const streakVelRef = useRef<number>(0);
  // v3.12 aperture grammar — exit-glow quad just past the leg-2
  // mouth. The "promise / frame / backlight" light source the
  // corridor exits onto.
  const glowRef = useRef<THREE.Mesh>(null);
  const lastTime = useRef<number>(-1);

  // Skip on narrow viewports — same gate as `LatentTopographyContours`.
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 760;
  }, []);

  const geometry = useMemo(() => {
    if (!enabled) return null;
    const { positions, colors, reveals, sizes, mouths } = buildWormholeWalls();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aReveal", new THREE.BufferAttribute(reveals, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aMouth", new THREE.BufferAttribute(mouths, 1));
    return geom;
  }, [enabled]);

  // v3.6 acceleration field — separate <lineSegments> geometry on the
  // inner surface of leg 2. Static buffers; the perceived flow comes
  // from camera dolly + uExitWarp opacity ramp.
  const streakGeometry = useMemo(() => {
    if (!enabled) return null;
    const { positions, colors, strengths, ends } = buildWormholeStreaks();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aStreamStrength", new THREE.BufferAttribute(strengths, 1));
    geom.setAttribute("aEnd", new THREE.BufferAttribute(ends, 1));
    return geom;
  }, [enabled]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: wallsVertex,
      fragmentShader: wallsFragment,
      uniforms: {
        uPointSize: { value: 6.5 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uVisibleFarMouthExtension: { value: VISIBLE_FAR_MOUTH_EXTENSION },
        uMouthLongRangeAlphaCap: { value: MOUTH_LONGRANGE_ALPHA_CAP },
        uReveal1: { value: 0 },
        uReveal2: { value: 0 },
        uRevealMouth: { value: 0 },
        uOpacity: { value: 0 },
        uExitWarp: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Streak material — minimal uniform set, additive blending so the
  // streaks read as light streaming past rather than solid lines.
  const streakMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: streakVertex,
      fragmentShader: streakFragment,
      uniforms: {
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uOpacity: { value: 0 },
        uExitWarp: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // v3.12 — exit-glow quad. A single plane geometry built once with
  // a half-extent matching the disk size; the fragment shader's
  // radial gradient handles the soft falloff so there is no hard
  // disk edge anywhere in the visible band.
  const glowGeometry = useMemo(() => {
    if (!enabled) return null;
    return new THREE.PlaneGeometry(EXIT_GLOW_HALF * 2, EXIT_GLOW_HALF * 2, 1, 1);
  }, [enabled]);

  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: exitGlowVertex,
      fragmentShader: exitGlowFragment,
      uniforms: {
        uInnerColor: { value: EXIT_GLOW_INNER_COLOR.clone() },
        uOuterColor: { value: EXIT_GLOW_OUTER_COLOR.clone() },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
      streakMaterial.dispose();
      glowMaterial.dispose();
      geometry?.dispose();
      streakGeometry?.dispose();
      glowGeometry?.dispose();
    };
  }, [material, streakMaterial, glowMaterial, geometry, streakGeometry, glowGeometry]);

  useFrame((state) => {
    if (!geometry) return;
    const { camera, viewport } = state;
    const now = state.clock.elapsedTime;
    const lastT = lastTime.current;
    lastTime.current = now;
    const dt = lastT < 0 ? 0 : Math.min(0.1, now - lastT);

    const transform = useDepthGatewayStore.getState().transform;
    const { paintProgress, active, armed, velocity } = transform;
    const painting = active || armed;

    material.uniforms.uPixelRatio.value = viewport.dpr;
    (material.uniforms.uCameraPos.value as THREE.Vector3).copy(camera.position);
    (streakMaterial.uniforms.uCameraPos.value as THREE.Vector3).copy(camera.position);

    if (!painting) {
      opacityRef.current = 0;
      streakVelRef.current = 0;
      material.uniforms.uOpacity.value = 0;
      material.uniforms.uReveal1.value = 0;
      material.uniforms.uReveal2.value = 0;
      material.uniforms.uRevealMouth.value = 0;
      material.uniforms.uExitWarp.value = 0;
      streakMaterial.uniforms.uOpacity.value = 0;
      streakMaterial.uniforms.uExitWarp.value = 0;
      glowMaterial.uniforms.uOpacity.value = 0;
      return;
    }

    const reveal1 = smoothstep(LEG_1_REVEAL_START, LEG_1_REVEAL_END, paintProgress);
    const reveal2 = smoothstep(LEG_2_REVEAL_START, LEG_2_REVEAL_END, paintProgress);
    // v3.12 — mouth ring reveal:
    //   1. Early ramp: rings resolve from haze as the camera leaves
    //      Thoughtform, so by the Navigate park the rim ring is a
    //      faint silhouette in front of the always-on exit glow.
    //   2. Yield fade: rings clear BEFORE the Build park (~0.923)
    //      so the gyroscope has a clean stage. The glow keeps its
    //      own residual envelope past the park, leaving a backlight
    //      without leaving the rings competing with the hero.
    const revealMouthRamp = smoothstep(MOUTH_REVEAL_START, MOUTH_REVEAL_END, paintProgress);
    const mouthYield = getMouthYieldFade(paintProgress);
    material.uniforms.uReveal1.value = reveal1;
    material.uniforms.uReveal2.value = reveal2;
    material.uniforms.uRevealMouth.value = revealMouthRamp * mouthYield;

    // v3.2 wormhole-exit widen — the tube splays radially outward at
    // the camera as we emerge into Build. The fragment fade follows
    // shortly after via `getBuildApproachFade` (window 0.86-0.97), so
    // the rails read as "opening up around you THEN dissolving" rather
    // than a flat opacity cut.
    material.uniforms.uExitWarp.value = getWormholeExitWarp(paintProgress);

    // v3.7 — the STREAKS run on their OWN bell envelope (peaks in the
    // mid-passthrough, gone before the Build composition forms) so they
    // read as the "exiting the wormhole" event that fires as you leave
    // Encode, NOT as something appearing at/after Build. This drives
    // the streak shader's `streamReveal`, so when the bell hits 0 the
    // streaks vanish regardless of the wall fade.
    const streakEnv = getWormholeExitStreak(paintProgress);
    streakMaterial.uniforms.uExitWarp.value = streakEnv;

    // Velocity lift sharpens the lattice during active travel.
    // |velocity| is in progress-units / sec; a 2x multiplier reaches
    // the lift cap at moderate scroll speeds.
    const absV = Math.abs(velocity);
    const velocityT = Math.min(1, absV * 2.0);
    const target = OPACITY_BASE + velocityT * OPACITY_VELOCITY_LIFT_MAX;

    // Critically-damped tracking so the lift doesn't snap.
    const k = 1 - Math.exp(-OPACITY_RESPONSE * dt);
    opacityRef.current += (target - opacityRef.current) * k;
    // Build-approach declutter (v3.1) — the wormhole rail walls fade
    // out across the approach to the Build park so the gimbal +
    // sources/surfaces stack carry the Build read without competing
    // ambient noise on the left/right edges. Stays at 0 through the
    // epilogue because paintProgress is pinned at 1.
    const buildFade = getBuildApproachFade(paintProgress);
    material.uniforms.uOpacity.value = Math.min(1, opacityRef.current) * buildFade;

    // v3.9 — streaks are VELOCITY-GATED: light streaks only make
    // sense while travelling fast, so the line layer eases in with
    // actual scroll speed and eases out at rest. The bell envelope
    // (`streakEnv` -> uExitWarp) still owns WHERE in the journey
    // streaks may appear at all (pre-Build only). smoothstep(0.06,
    // 0.32, velocityT): idle = 0, deliberate scroll ~= partial,
    // fast flick = full.
    const streakVelTarget = smoothstep(0.06, 0.32, velocityT);
    streakVelRef.current += (streakVelTarget - streakVelRef.current) * k;
    streakMaterial.uniforms.uOpacity.value =
      Math.min(1, opacityRef.current * 1.05) * streakVelRef.current;

    // v3.12 — exit glow runs on its OWN envelope (`getExitGlowEnvelope`)
    // independent of the wall opacity / build-approach fade. That's
    // intentional: the glow must SURVIVE past the Build park as a
    // residual backlight while the surrounding ambient walls fade.
    // No scroll-velocity gate either — the glow is the always-on
    // light source, not a kinetic accent. Peak alpha is small by
    // design (`EXIT_GLOW_PEAK_OPACITY`) so additive blending against
    // the gyroscope rims its silhouette without flooding it.
    glowMaterial.uniforms.uOpacity.value =
      getExitGlowEnvelope(paintProgress) * EXIT_GLOW_PEAK_OPACITY;
  });

  if (!geometry) return null;

  const glowZ = getExitGlowZ();

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
      {streakGeometry && (
        <lineSegments geometry={streakGeometry} material={streakMaterial} frustumCulled={false} />
      )}
      {glowGeometry && (
        <mesh
          ref={glowRef}
          geometry={glowGeometry}
          material={glowMaterial}
          position={[0, EXIT_GLOW_Y_DROP, glowZ]}
          frustumCulled={false}
        />
      )}
    </group>
  );
}
