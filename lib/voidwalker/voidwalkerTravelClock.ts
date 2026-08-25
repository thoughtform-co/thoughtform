/**
 * The VOIDWALKER TIME TUNNEL's clock — PURE (ADR-081). The through-line
 * stops being a vertical scroll and becomes a flight down the Z axis: you
 * fall into the brandmark parked at the end of the corridor, the wormhole
 * opens, and the nine beats fly at you newest-first while the years count
 * backwards on a graduated axis.
 *
 * `useVoidwalkerTravelScroll` measures and writes; every number it writes
 * comes from here, so the whole envelope is unit-pinned without a DOM
 * (`tests/lib/voidwalker-travel-clock.test.ts` — the `aboutDeckMath` and
 * `voidwalkerClock` precedent).
 *
 * ⚠ THREE-FREE, AND THAT IS LOAD-BEARING (landing-performance doctrine).
 * DOM components import this module, so a `three` import here — or an
 * import of `sceneGeom`, which pulls THREE at its line 1634 — would drag
 * the whole WebGL stack into the landing's First Load JS. The one value
 * this module needs from the scene is the camera's vertical FOV, so it is
 * MIRRORED below and pinned equal by the unit test (the `ringCtaBox` /
 * `journeyScalars` three-free-transport precedent).
 *
 * Reversible by construction: every value is a pure function of the
 * current runway progress. No state, no wall clock, no previous frame.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smootherstep — the corridor's own easing shape (zero velocity AND zero
 *  acceleration at both ends), so a beat neither leaps out of the fog nor
 *  jerks as it parks. */
const ease = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// ── The runway ────────────────────────────────────────────────────

/**
 * Total travel runway, in viewports. Ten stops (nine beats + the film
 * interlude) at ~1.15vh each, plus the entry dive and the foot.
 *
 * ⚠ PAIRED WITH `--vw-travel-runway` in voidwalker-travel.css. The CSS
 * owns the runway's height (it must exist before hydration or the page
 * reflows under the reader); this constant owns the arithmetic. Move
 * them together — the unit test pins the pairing by reading the sheet.
 */
export const VW_TRAVEL_RUNWAY_SVH = 14;

/** Fraction of the runway spent on the ENTRY dive: the camera falls into
 *  the parked brandmark, the wormhole mouth opens, and the masthead types
 *  in. Nothing has flown at the reader yet. */
export const VW_TRAVEL_ENTRY_FRAC = 0.1;

/**
 * Fraction of the runway spent on the FOOT: the tunnel closes, the last
 * beat clears, and the "plot your course" line arrives.
 *
 * ⚠ IT IS SIZED BY THE FLIGHT, NOT BY EYE. The last stop's home sits
 * `0.5·w` short of the stops' band, and a beat needs `SPAN/2` stops of
 * runway past its home to fly all the way out. Below ~0.11 the final beat
 * is still on screen at `p = 1` — stranded, at a couple of percent
 * opacity, over the foot. 0.12 clears it with a little margin; if SPAN or
 * PARK move, this moves with them (the unit test fails if it does not).
 */
export const VW_TRAVEL_FOOT_FRAC = 0.12;

/** Fraction of ONE stop over which a beat is held at the reading plane.
 *  This is the dead zone that makes the beat readable — the travel pauses
 *  in Z while the beat's own power-on ladder plays out.
 *
 *  ⚠ The dead-scroll ban (owner ruling, `unifiedServicesInstrument.ts`)
 *  is satisfied here rather than violated: across a park the beat's
 *  `--vw-b` ladder is still scrubbing, the NEXT beat is already growing
 *  out of the fog behind it, and the tunnel keeps flowing with the
 *  scroll. Nothing on screen is inert. */
export const VW_TRAVEL_PARK = 0.44;

/**
 * How many stops a beat's full −1 → +1 flight spans.
 *
 * ⚠ IT MUST EXCEED 2, AND "> 1" IS THE TRAP. The intuition is that any
 * span over one stop makes beats overlap; the arithmetic says otherwise.
 * A neighbour sits exactly 1.0 stop away, and the flight only starts
 * outside the park's dead zone, so the reach available to it is
 * `SPAN/2 − PARK/2`. At SPAN 1.72 that reach is 0.64 against a distance
 * of 0.78 — the next beat is already pinned at −1 (invisible) at the
 * moment the current one parks, and the field degrades to a slideshow of
 * one card at a time.
 *
 * At 3.8 a neighbour sits at t ≈ −0.46 while its predecessor is parked:
 * about half size, a quarter opacity, clearly further down the tunnel.
 * Two stops out it is fully fogged, so at most three stops ever paint —
 * which is also the compositing budget this layer is designed around.
 */
export const VW_TRAVEL_SPAN = 3.8;

// ── The damping ───────────────────────────────────────────────────

/**
 * Time constant (seconds) of the flight's chase. Carried over from the
 * motion follower's retired `voidTravel` channel, so the seam out of the
 * fly-into-sphere still hands over on one time constant.
 *
 * ⚠ THIS IS THE AUTHORITY, NOT A MIRROR — and that is the point. The FOV
 * above is mirrored because `sceneGeom` pulls THREE and cannot be
 * imported here; a time constant needs no such copy, so the follower's
 * channel was DELETED rather than pinned equal to this one. A dead damped
 * channel that still looks authoritative is how the second clock comes
 * back.
 *
 * ⚠ AND IT IS WHY THE FIELD READS AS ONE SPACE. Until this existed the
 * camera flew a DAMPED value (the follower's `voidTravel` channel) while
 * the DOM beats were written from RAW scroll in a different rAF: the two
 * layers shared a projection and not a clock, so on any real scroll the
 * cards snapped with the wheel while the walls glided behind them. One
 * chase, owned by the hook, read by the DOM, the camera and the tunnel.
 */
export const VW_TRAVEL_TAU_S = 0.18;

/** Jump rather than glide past this much of the runway in one step — a
 *  hash-nav or a scroll-restore landing mid-flight must not fly the whole
 *  wormhole. Mirror of the follower's own threshold. */
const VW_TRAVEL_SNAP = 0.5;
/** Sub-perceptual settle, so a reader parked at a beat sits at exactly
 *  the scrubbed depth with no micro-creep. Mirror of the follower's. */
const VW_TRAVEL_SETTLE = 0.0004;

/**
 * One step of the flight's exponential chase: covers ~63 % of the
 * remaining gap per tau, ~95 % in 3·tau. Pure — `current` and `dt` are
 * the caller's, so this stays unit-pinnable with no wall clock.
 */
export function travelChase(current: number, target: number, dtSeconds: number): number {
  if (!Number.isFinite(current)) return target;
  const d = target - current;
  if (Math.abs(d) > VW_TRAVEL_SNAP) return target;
  const dt = clamp(Number.isFinite(dtSeconds) ? dtSeconds : 0, 0, 0.1);
  const next = current + d * (1 - Math.exp(-dt / VW_TRAVEL_TAU_S));
  return Math.abs(target - next) < VW_TRAVEL_SETTLE ? target : next;
}

// ── Depth ─────────────────────────────────────────────────────────

/** Where a beat is born, in CSS px of translateZ (negative = away). */
export const VW_Z_FAR = -2600;

/** Where a beat dies, in CSS px of translateZ (positive = toward the
 *  reader). ⚠ MUST stay well under the perspective distance: an element
 *  at `z → P` projects to infinite scale. At the binding viewport P is
 *  ~1160px, so 780 leaves ~380px of headroom and the beat has faded out
 *  long before it gets there. */
export const VW_Z_NEAR = 780;

/** Beats fade IN over this much of the far half — they arrive out of the
 *  fog rather than popping. Paired with `VW_TRAVEL_SPAN`: it has to reach
 *  far enough back that the NEXT beat is faintly visible behind the
 *  parked one, or the overlap the span buys is invisible anyway. */
const FOG_IN = 0.7;
/** …and OUT over this much of the near half, so a beat dissolves as it
 *  passes the shoulder instead of clipping through the camera. */
const FOG_OUT = 0.72;

/**
 * Peak defocus, in px, at the extremes of the flight. Cheap (one
 * composited filter on ≤3 planes at a time) and it is what sells
 * depth-of-field on a DOM layer sitting over a WebGL bed.
 *
 * ⚠ IT HAS TO COMMIT. Measured on the first live capture: a receding beat
 * one stop back sits at ~24 % opacity and half scale, and at under a pixel
 * of blur its TYPE stays legible — so it reads as two paragraphs printed
 * over each other rather than as one behind the other. Depth on a flat
 * layer is carried by focus far more than by opacity; the ramp below
 * reaches full defocus by |t| 0.55 rather than easing to it at 1.
 */
export const VW_BLUR_MAX = 5;

/** How far into the flight the defocus saturates. Short on purpose — the
 *  park must be perfectly sharp and everything else must not compete. */
const BLUR_REACH = 0.55;

// ── The camera's mirrored FOV ────────────────────────────────────

/**
 * ⚠ MIRROR of `CAMERA_FOV` in `DepthGatewayScene/sceneGeom.ts`, which
 * cannot be imported here (it pulls THREE). Pinned equal by
 * `tests/lib/voidwalker-travel-clock.test.ts`.
 *
 * This is the number that makes the DOM beats and the WebGL tunnel one
 * space: the CSS `perspective` is derived from it below, so a beat's
 * projected scale at a given Z matches what the scene camera would do
 * with the same geometry. Two layers with different projections read as
 * a sticker over a video, which is the failure this avoids.
 */
export const VW_CAMERA_FOV_DEG = 38;

/** Desktop-equivalent horizontal FOV the portrait widening preserves —
 *  mirror of `TARGET_HFOV_DEG`. */
const VW_TARGET_HFOV_DEG = 60;
/** Hard cap on the widened vertical FOV — mirror of `MAX_FOV_DEG`. */
const VW_MAX_FOV_DEG = 70;

/** Aspect-aware vertical FOV — mirror of `getCameraFov`. */
export function travelCameraFovDeg(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect >= 1) return VW_CAMERA_FOV_DEG;
  const targetH = (VW_TARGET_HFOV_DEG * Math.PI) / 180;
  const vfovRad = 2 * Math.atan(Math.tan(targetH / 2) / aspect);
  const vfovDeg = (vfovRad * 180) / Math.PI;
  return Math.min(VW_MAX_FOV_DEG, Math.max(VW_CAMERA_FOV_DEG, vfovDeg));
}

/**
 * The CSS `perspective` (px) that matches the scene camera's projection
 * for a viewport of `vh` px at `aspect`.
 *
 * A CSS perspective of P projects a plane at depth z to scale P/(P−z);
 * a pinhole camera with vertical FOV θ framing a viewport of height H
 * has its eye at H/2 / tan(θ/2). Setting those equal is the whole
 * derivation — one line, and it is why the tunnel and the beats agree.
 */
export function travelPerspectivePx(vh: number, aspect: number): number {
  const fov = (travelCameraFovDeg(aspect) * Math.PI) / 180;
  return Math.max(320, vh / 2 / Math.tan(fov / 2));
}

// ── The stop schedule ─────────────────────────────────────────────

/** The runway fraction at which stop `i` of `n` sits at the reading
 *  plane. Stops tile the middle of the runway between the entry dive and
 *  the foot; the ±0.5 centres each stop in its own slice. */
export function stopHome(i: number, n: number): number {
  if (n <= 0) return 0.5;
  const span = 1 - VW_TRAVEL_ENTRY_FRAC - VW_TRAVEL_FOOT_FRAC;
  return VW_TRAVEL_ENTRY_FRAC + ((i + 0.5) / n) * span;
}

/** The width of one stop, as a runway fraction. */
export function stopWidth(n: number): number {
  if (n <= 0) return 1;
  return (1 - VW_TRAVEL_ENTRY_FRAC - VW_TRAVEL_FOOT_FRAC) / n;
}

/**
 * One stop's flight parameter.
 *
 *   −1  born at `VW_Z_FAR`, deep in the tunnel, invisible
 *    0  PARKED at the reading plane (held across the park dead zone)
 *   +1  gone past the camera at `VW_Z_NEAR`, invisible
 *
 * Monotone non-decreasing in `p`, so the flight is reversible and a
 * scroll-back retraces it exactly.
 */
export function beatTravelT(p: number, i: number, n: number): number {
  const w = stopWidth(n);
  if (w <= 0) return 0;
  // Offset from this stop's home, in stops.
  const u = (clamp01(p) - stopHome(i, n)) / w;
  const dead = VW_TRAVEL_PARK / 2;
  const a = Math.abs(u) - dead;
  if (a <= 0) return 0;
  const reach = VW_TRAVEL_SPAN / 2 - dead;
  if (reach <= 0) return u < 0 ? -1 : 1;
  const s = clamp01(a / reach);
  return u < 0 ? -s : s;
}

/** A stop's depth in CSS px, from its flight parameter. */
export function beatDepthPx(t: number): number {
  const x = clamp(t, -1, 1);
  if (x < 0) return lerp(VW_Z_FAR, 0, ease(1 + x));
  return lerp(0, VW_Z_NEAR, ease(x));
}

/** A stop's opacity: out of the fog on the way in, dissolved on the way
 *  past. 1 across the whole park. */
export function beatOpacity(t: number): number {
  const x = clamp(t, -1, 1);
  if (x < 0) {
    // −1 → −FOG_IN is fully fogged; −FOG_IN → 0 fades up.
    return ease(clamp01((x + FOG_IN) / FOG_IN));
  }
  return 1 - ease(clamp01(x / FOG_OUT));
}

/** A stop's defocus in px — zero across the park, saturating quickly once
 *  the stop leaves the reading plane in either direction. */
export function beatBlurPx(t: number): number {
  const x = Math.abs(clamp(t, -1, 1));
  return VW_BLUR_MAX * ease(clamp01(x / BLUR_REACH));
}

/**
 * A stop's own power-on clock, mapped onto its approach so the ADR-074
 * ladder (`--ci-off` panels, the per-word title brighten, the marker
 * fill) plays out AS the beat settles rather than being replaced.
 *
 * Reaches 1 just before the park opens and holds there, so a parked beat
 * is fully lit for the whole time it is readable.
 */
export function beatPowerOn(t: number): number {
  return clamp01((clamp(t, -1, 1) + 0.46) / 0.4);
}

// ── The trajectory ────────────────────────────────────────────────

/**
 * ⚠ THE FLIGHT PATH IS AUTHORED IN SCREEN FRACTIONS, NOT IN CSS PX, AND
 * THAT IS THE WHOLE CORRECTION.
 *
 * The first cut offset a beat by a flat `±7%` of its own 680px box —
 * about 48px — and then projected it. At `VW_Z_FAR` the projected scale
 * is `P/(P−z)` ≈ 0.31, so those 48px arrive on screen as FIFTEEN: every
 * beat flew at the reader dead centre and the alternation only appeared
 * once it had already parked. The "asymmetrical, alternating" reading was
 * arithmetically invisible for the entire approach.
 *
 * So the path is declared where it is read — as a fraction of the
 * viewport — and the hook multiplies back through the beat's own depth
 * (`(P − z)/P`, the inverse of the projection) to get the CSS offset. The
 * curve below is therefore literally what the reader sees.
 */

/** Lateral offset at the reading plane, as a fraction of viewport width.
 *  Roughly what the old flat 7 % produced once parked, so the park's
 *  composition is unchanged — only the approach to it is. */
const VW_X_PARK = 0.042;
/** …at birth, deep in the tunnel: the beat enters from the side wall. */
const VW_X_FAR = 0.2;
/** …and as it passes the camera, thrown wide off its own side. */
const VW_X_NEAR = 0.62;

/** Vertical offset at birth, as a fraction of viewport height, signed
 *  AGAINST the lateral side so left beats fall in from high and right
 *  beats rise from low. A field that alternates on one axis only reads as
 *  a fan; crossing the two makes each arrival its own path. */
const VW_Y_FAR = 0.1;
/** …and as it leaves, continuing the same diagonal past the shoulder. */
const VW_Y_NEAR = 0.16;

/** Peak yaw, degrees. The beat is turned toward the axis at depth and is
 *  exactly flat at the park — type is never read on a skewed plane. */
const VW_ROT_MAX = 9;

/** `side` is +1 for a right-hand beat, −1 for a left-hand one — the
 *  record's own `data-side`, never a `:nth-child` parity (the film
 *  interlude sits in the same list and would flip every beat under it). */
export type VwSide = 1 | -1;

/** How far the path has travelled from the park, eased, 0 → 1. */
const away = (t: number) => ease(Math.abs(clamp(t, -1, 1)));

/**
 * Lateral position at flight parameter `t`, as a SIGNED FRACTION OF
 * VIEWPORT WIDTH (see the block comment above).
 */
export function beatScreenXFrac(t: number, side: VwSide): number {
  const x = clamp(t, -1, 1);
  const to = x < 0 ? VW_X_FAR : VW_X_NEAR;
  return side * lerp(VW_X_PARK, to, away(x));
}

/** Vertical position at `t`, as a signed fraction of viewport height. */
export function beatScreenYFrac(t: number, side: VwSide): number {
  const x = clamp(t, -1, 1);
  const to = x < 0 ? VW_Y_FAR : -VW_Y_NEAR;
  return -side * lerp(0, to, away(x));
}

/** Yaw at `t`, degrees. Zero at the park in both directions. */
export function beatRotDeg(t: number, side: VwSide): number {
  return -side * VW_ROT_MAX * away(t);
}

/**
 * The CSS offset for a screen fraction, given the beat's own depth and
 * the stage's measured perspective — the inverse of the projection, so
 * the authored curve arrives on screen unchanged at every viewport.
 */
export function beatDepthUnproject(z: number, perspectivePx: number): number {
  const p = perspectivePx > 1 ? perspectivePx : 1;
  return (p - z) / p;
}

// ── Slim in flight, full on park ──────────────────────────────────

/** How much of the approach the detail takes to power on. */
const VW_DETAIL_IN = 0.3;
/** …and how quickly it goes once the beat leaves. Shorter: the reading
 *  is over the moment it starts to recede, and a paragraph that follows
 *  the plate out competes with the one arriving behind it. */
const VW_DETAIL_OUT = 0.16;

/**
 * The DETAIL gate — the owner's "slim in flight, full on park".
 *
 * In flight a beat is its year, its title and its housing. The paragraph,
 * the wireframe plate and the press bar power on as it settles and go as
 * it leaves, so what flies is an object and what parks is a record.
 *
 * ⚠ It is a separate channel from `beatPowerOn`, deliberately. `--vw-b`
 * lights the beat's own chrome and holds once lit; this one PEAKS at the
 * park. Folding them together would either strip the title in flight or
 * carry a full paragraph out through the camera — and rastering a 680px
 * card carrying an SVG drawing under a per-frame blur is the single most
 * expensive thing this layer can do.
 */
export function beatDetail(t: number): number {
  const x = clamp(t, -1, 1);
  if (x <= 0) return ease(clamp01((x + VW_DETAIL_IN) / VW_DETAIL_IN));
  return 1 - ease(clamp01(x / VW_DETAIL_OUT));
}

/** Which stop is currently nearest the reading plane. */
export function activeStop(p: number, n: number): number {
  if (n <= 0) return 0;
  const w = stopWidth(n);
  const raw = Math.floor((clamp01(p) - VW_TRAVEL_ENTRY_FRAC) / w);
  return clamp(raw, 0, n - 1);
}

// ── Entry, foot, and the flight scalar ───────────────────────────

/** The ENTRY dive, 0 → 1: the camera falls into the parked brandmark and
 *  the wormhole mouth opens. Saturates before the first beat arrives. */
export function entryT(p: number): number {
  return ease(clamp01(clamp01(p) / VW_TRAVEL_ENTRY_FRAC));
}

/** The FOOT, 0 → 1 across the runway's tail. */
export function footT(p: number): number {
  const start = 1 - VW_TRAVEL_FOOT_FRAC;
  return ease(clamp01((clamp01(p) - start) / VW_TRAVEL_FOOT_FRAC));
}

/**
 * The flight scalar the WebGL side reads: how far down the tunnel we
 * are, 0 → 1 across the whole runway, LINEAR on purpose.
 *
 * ⚠ Linear because the tunnel is a continuous medium, not an object with
 * an entrance: easing this would make the walls surge and slow between
 * beats, which reads as the reader's own scroll stuttering. The eased
 * shapes belong to the things that arrive (the beats, the entry dive),
 * never to the medium they arrive through.
 */
export function travelFlight(p: number): number {
  return clamp01(p);
}

/**
 * The masthead's arm state, with hysteresis so it cannot churn when the
 * reader rests on the threshold. It types in as the wormhole opens and
 * un-types as the first beat takes the plane — the masthead law (it
 * never moves and never fades; it types in and un-types out, in place).
 */
export function travelHeadArmed(prev: boolean, p: number): boolean {
  const x = clamp01(p);
  const on = VW_TRAVEL_ENTRY_FRAC * 0.34;
  const off = VW_TRAVEL_ENTRY_FRAC * 1.24;
  const h = VW_TRAVEL_ENTRY_FRAC * 0.06;
  if (x >= on + h && x <= off - h) return true;
  if (x < on - h || x > off + h) return false;
  return prev;
}

// ── The graduated axis (ADR-081's date grammar, A4) ───────────────

/**
 * Where the axis marker sits, 0 → 1 from the newest year to the oldest.
 *
 * The axis is A4 — the owner's pick — carried into three dimensions: the
 * years are POSITIONS, not labels, so the uneven gaps between beats are
 * the reading. In the tunnel the same graduation is drawn twice: here as
 * a fixed rail the reader can scan, and in the scene as one gold ring
 * per year flying past. The ring cadence and this marker share the stop
 * schedule, so they cannot drift.
 */
export function axisT(p: number): number {
  const x = clamp01(p);
  const span = 1 - VW_TRAVEL_ENTRY_FRAC - VW_TRAVEL_FOOT_FRAC;
  if (span <= 0) return 0;
  return clamp01((x - VW_TRAVEL_ENTRY_FRAC) / span);
}

/**
 * The year the axis reads at runway position `p`, interpolated across the
 * stops' own years so the readout counts backwards continuously rather
 * than snapping at each beat.
 *
 * `years` must be the stops' `sortYear`s in runway order (newest first).
 */
export function travelYear(p: number, years: readonly number[]): number {
  const n = years.length;
  if (n === 0) return 0;
  if (n === 1) return years[0]!;
  const w = stopWidth(n);
  if (w <= 0) return years[0]!;
  // Position measured in stops, clamped to the first and last home.
  const s = clamp((clamp01(p) - stopHome(0, n)) / w, 0, n - 1);
  const i = Math.min(n - 2, Math.floor(s));
  return lerp(years[i]!, years[i + 1]!, s - i);
}

/**
 * Where the axis MARKER sits, 0 (newest) → 1 (oldest) — measured in
 * YEARS, not in runway.
 *
 * ⚠ THIS IS THE WHOLE POINT OF A4 AND IT IS NOT `axisT`. The stops are
 * evenly spaced in scroll, but the years they carry are not: 2026→2025 is
 * one year and 2022→2020 is two. A marker driven by runway fraction would
 * slide down a proportional axis at a constant rate and land between its
 * own ticks — the gaps would be drawn and then contradicted by the thing
 * moving over them. Driving it from the interpolated YEAR instead makes
 * the marker accelerate across the wide gaps and dwell in the dense ones,
 * so "the gaps are the reading" is true kinetically as well as visually.
 */
export function axisYearFrac(p: number, years: readonly number[]): number {
  if (years.length < 2) return 0;
  const newest = years[0]!;
  const oldest = years[years.length - 1]!;
  const total = newest - oldest;
  if (Math.abs(total) < 1e-6) return 0;
  return clamp01((newest - travelYear(p, years)) / total);
}

/**
 * The record's years as WHOLE years — the one definition, used by every
 * consumer that letters or places a date.
 *
 * ⚠ `Math.floor`, NEVER `Math.round`, AND IT IS NOT COSMETIC. Two beats
 * carry fractional `sortYear`s purely to order them inside a year they
 * SHARE (2018.9 before 2018, 2016.8 before 2016). Rounded, those became
 * **2019** and **2017** — years no chip on the surface prints — so the
 * rail's readout lettered 2019 beside a parked card reading 2018, and the
 * marker seated between its own rungs at 0.592 instead of on 2018's rung
 * at 0.667. Caught on a live capture, not by any assertion.
 *
 * Flooring at the source is what makes the readout, the marker, the rail's
 * labels and the tunnel's ring cadence agree — they all measure `years`,
 * so they can only agree if they are handed the same numbers.
 */
export function wholeYears(years: readonly number[]): number[] {
  return years.map((y) => Math.floor(y));
}

/** Where a given year sits on the axis, 0 (newest) → 1 (oldest). The
 *  ticks and their labels are placed with this, so they and the marker
 *  share one measure. */
export function yearFrac(year: number, years: readonly number[]): number {
  if (years.length < 2) return 0;
  const newest = years[0]!;
  const oldest = years[years.length - 1]!;
  const total = newest - oldest;
  if (Math.abs(total) < 1e-6) return 0;
  return clamp01((newest - year) / total);
}

/**
 * The tunnel's ring cadence: how many YEARS have passed the camera at
 * runway position `p`. One gold ring per year, so the rings ARE the
 * graduation the axis draws — same measure, two places, and they cannot
 * drift because both come from `travelYear`.
 */
export function ringsPassed(p: number, years: readonly number[]): number {
  if (years.length < 2) return 0;
  return Math.max(0, years[0]! - travelYear(p, years));
}
