/**
 * holoProgramGeom — the trajectory ARTIFACT's arithmetic, with no three.
 *
 * ⚠ THREE-FREE ON PURPOSE. `components/arcs` may import this file (the
 * `journeyScalars` / `ringMath` transport pattern); a `three` import here
 * would drag the WebGL stack into the arc route's First Load JS, which is
 * the one thing `.claude/rules/arcs.md` bans outright.
 *
 * ⚠ ROUND 2: THIS IS A FREE OBJECT, NOT A CHART UNDER FIXED LABELS.
 * Round 1 solved every ring's world x so it would land under a
 * server-positioned DOM station, which forced ONE camera pose, forbade drag
 * and rendered the rings nearly edge-on — the owner's "flat circles… the
 * illusion of a 3D object". The alignment solver is gone; the object is
 * orbited with real controls and the LABELS follow IT (see holoAnchorsRef).
 *
 * ⚠ IT STILL PLOTS THE RECORD. The waypoints keep their authored `at`
 * spacing (unequal — the gaps are the reading) and a ring's radius is still
 * the adoption reach at its date. What changed is that the record is now the
 * BRIGHT LAYER of a machine rather than the whole drawing.
 */

/** The waypoint shape the scene needs — structurally the arc's own
 *  `ArcProgramWaypoint`, re-declared so this module imports no `lib/arcs`
 *  (the seam runs one way: the arc feeds the scene, never the reverse). */
export interface HoloWaypoint {
  id: string;
  label: string;
  sub?: string;
  /** The sentence on what the move WAS. ⚠ THE SCENE LETTERS NONE OF THIS —
   *  no glyph in the drawing carries a string; the tracked DOM layer owns
   *  every word. Declared so a harness renders production's real chrome. */
  note?: string;
  at: number;
  seat?: true;
}

/* ── Determinism ─────────────────────────────────────────────────────── */

/**
 * Mulberry32 — the repo's own seeded PRNG (`lib/brandmark/sampleShape.ts`).
 *
 * ⚠ EVERY SECONDARY LAYER IS SEEDED, NEVER `Math.random()`. A random draw in
 * a render is a hydration mismatch and a screenshot that never reproduces —
 * the flat board's own SCATTER comment says the same thing. The reference
 * seeds its whole cluster from one integer (`seed: 368`); so does this.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The object's seed. One integer determines every secondary layer, so the
 *  artifact is identical on every render, machine and screenshot. */
export const HOLO_SEED = 368;

/* ── The adoption ladder ─────────────────────────────────────────────── */

/**
 * The adoption curve's treads, lifted from the flat board's own path.
 *
 * `ArcProgramBoard.CURVE` is
 * `M30 54H150V48H270V42H390V35H510V28H630V21H750V13H870V6H975` in a 1000×60
 * box — eight runs, rising, never interpolated. Here each run is
 * `[atStart, level]` with `at = (x − 30) / 945` and `level = (54 − y) / 48`,
 * so the two drawings encode ONE curve.
 *
 * ⚠ A STEP FUNCTION, NOT A RAMP. `levelAt` never interpolates between
 * treads: adoption arrived in steps and the record says so. Unit-pinned.
 */
export const ADOPTION_TREADS: readonly (readonly [atStart: number, level: number])[] = [
  [0.0, 0.0],
  [0.127, 0.125],
  [0.254, 0.25],
  [0.381, 0.396],
  [0.508, 0.542],
  [0.635, 0.688],
  [0.762, 0.854],
  [0.889, 1.0],
];

/** The adoption level at a point on the time axis — the last tread reached. */
export function levelAt(at: number): number {
  let level = ADOPTION_TREADS[0][1];
  for (const [start, value] of ADOPTION_TREADS) {
    if (at + 1e-9 < start) break;
    level = value;
  }
  return level;
}

/* ── The object's world ──────────────────────────────────────────────── */

/**
 * The axis runs along world Z (into the screen at rest), which is what makes
 * this read as a TUNNEL of rings rather than a row of them.
 *
 * ⚠ ROUND 1 RAN IT ALONG X and that is most of why it looked flat: with the
 * axis across the screen, every ring is seen near edge-on and the stack has
 * no depth to orbit through. Down the Z axis with the camera raised and
 * swung off-centre, the rings open into ellipses and the object has an
 * inside — the reference's own arrangement.
 */
export const AXIS_HALF = 2.55;

/** A waypoint's position along the axis, from its authored date. The record's
 *  UNEQUAL gaps survive verbatim: `at` maps linearly to depth. */
export function waypointZ(at: number): number {
  return -AXIS_HALF + at * (2 * AXIS_HALF);
}

/** Ring radii in world units — the adoption reach at that date, so the flat
 *  board's ladder and this object encode ONE curve. The growth also gives the
 *  object its cone silhouette. */
export const R_MIN = 0.46;
export const R_MAX = 1.02;

export function ringRadius(at: number): number {
  return R_MIN + (R_MAX - R_MIN) * levelAt(at);
}

/** The seat's inner ring, as a fraction of its own radius — the doublet that
 *  reads as "seated" rather than as an eighth station. */
export const SEAT_INNER_K = 0.82;

/** Ring loop resolution. Matches HologramOrbits' SEGMENTS so the stroke
 *  draw-on has the same granularity the corridor's rings do. */
export const RING_SEGMENTS = 180;

/** One rim tick per this much circumference, and every Nth tick is drawn
 *  long — the reference's `tickRing` grammar (`major` every 8th).
 *  ⚠ Never map a tick count to a published figure: the registers letter
 *  those, and a drawing that says it twice is this estate's said-twice
 *  defect. Ticks are graduation, not data. */
export const TICK_PITCH = 0.1;
export const TICK_LEN = 0.1;
export const TICK_MAJOR_EVERY = 8;

export function tickCount(radius: number): number {
  return Math.max(16, Math.round((2 * Math.PI * radius) / TICK_PITCH));
}

/** The bright arc's share of a ring's circumference — the reference's
 *  `arcFill`. These are the bloom donors and the aberration's fringe. */
export const ARC_FILL = 0.11;

/** The floor grid. ⚠ It is the QUIETEST thing in the frame — a full plane
 *  has far more ink than a stack of rings, so equal alpha is not equal
 *  presence and the first cut's 0.15 made the ground the subject. */
export const GRID_Y = -2;
export const GRID_EXTENT = 5;
export const GRID_SPACING = 1;

/**
 * Where a waypoint's label hangs off its ring, in radians around the rim.
 *
 * ⚠ ALTERNATING, and that is not decoration. Anchored at every ring's TOP
 * the seven labels projected into one tight diagonal and overlapped into
 * mush — the same collision the flat board solves with its up/down lanes.
 * Splitting them above and below the cone doubles the pitch between
 * same-side neighbours, which is what buys each one room.
 */
export function anchorAngle(index: number): number {
  const up = index % 2 === 0;
  // A slight lean off vertical so a label never sits exactly over the one
  // two rings along.
  const lean = ((index % 4) - 1.5) * 0.16;
  return up ? Math.PI / 2 + lean : -Math.PI / 2 + lean;
}

/* ── The secondary structure (the reference's other ten layers) ──────── */

export interface HoloShell {
  z: number;
  radius: number;
  /** `dotted` = a dash ring, `frame` = a thin continuous ring, `arc` = a
   *  partial sweep. Three kinds is what stops the filler reading as a
   *  repeat of the record's own rings. */
  kind: "dotted" | "frame" | "arc";
  /** Start angle and sweep, for `arc`. */
  from: number;
  sweep: number;
  opacity: number;
}

/**
 * The shells BETWEEN the record's rings.
 *
 * ⚠ THEY CARRY NO READING, and that is deliberate: the reference's density
 * comes from eleven layers of structure with the tracked data as the bright
 * few. Without them seven rings on an axis is a chart. With them the record
 * sits inside a machine. They are seeded, so they never move.
 *
 * ⚠ They are also dimmer and thinner than any waypoint ring by construction
 * (opacity ceiling below the record's floor), so the eye can always tell the
 * record from the machine it lives in.
 */
export function buildShells(count = 22, seed = HOLO_SEED): HoloShell[] {
  const rnd = mulberry32(seed);
  const shells: HoloShell[] = [];
  const kinds: HoloShell["kind"][] = ["dotted", "frame", "arc"];
  for (let i = 0; i < count; i++) {
    const t = rnd();
    const z = -AXIS_HALF - 0.5 + t * (2 * AXIS_HALF + 1);
    // Shell radii ride the same cone the record does, loosened either way so
    // the object has thickness rather than a single skin.
    const along = (z + AXIS_HALF) / (2 * AXIS_HALF);
    const base = R_MIN + (R_MAX - R_MIN) * Math.max(0, Math.min(1, along));
    const radius = base * (0.55 + rnd() * 1.25);
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const from = rnd() * Math.PI * 2;
    const sweep = 0.35 + rnd() * 2.1;
    /* ⚠ THE CORRIDOR'S CONTRAST LAW. Its armillary runs decorative rings at
       opacity 0.22–0.28 against structural rings at 0.62–0.74 — three times
       dimmer — and THAT is what makes a dense ring set read as depth rather
       than as clutter. These stay strictly under the record's own floor. */
    shells.push({ z, radius, kind, from, sweep, opacity: 0.08 + rnd() * 0.14 });
  }
  return shells;
}

/** Line weights, split the way the corridor splits them: what carries the
 *  record is twice as thick as what carries the depth. */
export const LW_RECORD = 1.6;
export const LW_SEAT = 2.3;
export const LW_MARK_RING = 1.9;
export const LW_SHELL = 0.85;

/** The dust cloud's size — the reference's `particleCount: 2000`. */
export const DUST_COUNT = 2000;
export const DUST_SPREAD = 3.4;

/** The wireframe core: nodes linked at this density, the reference's
 *  `nodeCount: 6 / linkDensity: .35 / networkOpacity: .48`. */
export const CORE_NODES = 7;
export const CORE_LINK_DENSITY = 0.42;
export const CORE_RADIUS = 0.5;

/* ── Camera, pose and controls ───────────────────────────────────────── */

/**
 * A LONG-ISH LENS at a RAISED, SWUNG pose.
 *
 * ⚠ THE POSE IS THE WHOLE DIFFERENCE between round 1 and the reference. The
 * reference's rings are coaxial too — what makes them read as a solid object
 * is that the camera looks DOWN on the stack (elevation −16° to −27°) and
 * off to one side (azimuth), so every ring opens into an ellipse and the
 * stack has an interior. Round 1 sat on the axis' own level and got lines.
 */
export const CAM_FOV = 22;
/** Orbit rest pose, in radians. Azimuth swings around Y, elevation lifts. */
/**
 * ⚠ SWUNG WELL OFF THE AXIS. At 18° the stack was nearly end-on: the seven
 * rings piled into one another and the record was unreadable at rest, even
 * though a drag immediately fixed it. The rest pose has to be the pose the
 * object reads best in — the reader should not have to work for the first
 * impression. At ~54° the barrel lies across the frame, the rings stay open
 * ellipses, and the dated sequence is legible before anyone touches it.
 */
/** ⚠ NEGATIVE, so the record reads LEFT TO RIGHT. At +54° the barrel lay the
 *  right way round but the dates ran backwards — 2024 on the right and Now on
 *  the left — which is a timeline a Western reader has to read against the
 *  grain. The sign is the whole fix. */
export const REST_AZIMUTH = (-54 * Math.PI) / 180;
export const REST_ELEVATION = (19 * Math.PI) / 180;
/**
 * ⚠ MEASURED, NOT GUESSED. The object spans `2·AXIS_HALF` (5.1) down its
 * axis and `2·R_MAX` (2.04) across, and the near end sits closer to the
 * camera than the target. At the first cut's 6.9 the visible height at the
 * target was 2.68 — the object overflowed the frame and the near rings were
 * enormous. A long lens needs standoff to match.
 */
export const CAM_DISTANCE = 15.6;

/* ── The centre: the mark, and the ring it opens into ────────────────── */

/**
 * The Thoughtform brandmark sits at the origin, and the loops emerge from
 * it. That is the method drawn, not decoration: the Arc — Navigate, Encode,
 * Build — is *a renewing arc on live work*, and repeated arcs accumulate the
 * map. Each ring is one dated beat of the engagement; the mark at their
 * origin is what they all came out of.
 *
 * ⚠ `sampleBrandmark3D` bakes `MARK_SCALE = 1.74` in unconditionally, so its
 * `armHomes` span a half-extent of ≈0.87 rather than 0.5. Every production
 * consumer re-normalises after sampling and so does this one — `MARK_SCALE`
 * below is applied to the mounted group, not to the sampler.
 */
export const MARK_SCALE = 1.4;

/**
 * The ring at the mark's shoulder.
 *
 * ⚠ IT IS AN ABSTRACT RING AND IT TRACES NOTHING (owner, 2026-08-25). The
 * rhyme with Loop is carried by FORM — their product is a ring — not by a
 * borrowed mark: there is no Loop asset in this repo, and the house design
 * doctrine says Thoughtform.co never carries client identity. It is also the
 * ONLY fully closed, unbroken ring in the object, which is what makes it
 * read as the origin the others opened out of.
 */
export const MARK_RING_RADIUS = 1.28;

/** How far the reader may tilt. Clamped so the object can never be viewed
 *  from directly overhead or from underneath the floor grid. */
export const POLAR_MIN = (52 * Math.PI) / 180;
export const POLAR_MAX = (104 * Math.PI) / 180;

/** Orbit damping, and the slow drift that keeps it alive when untouched. */
export const ORBIT_DAMPING = 0.075;
export const AUTO_ROTATE_SPEED = 0.32;

/** The camera's resting position, derived from the pose. Spherical → world. */
export function restCameraPosition(): readonly [number, number, number] {
  const r = CAM_DISTANCE;
  const y = Math.sin(REST_ELEVATION) * r;
  const h = Math.cos(REST_ELEVATION) * r;
  return [Math.sin(REST_AZIMUTH) * h, y, Math.cos(REST_AZIMUTH) * h];
}

/* ── Idle life (the reference's breathe / flicker / twinkle) ──────────── */

/**
 * ⚠ WALL-CLOCK MOTION, AND IT IS A DELIBERATE EXCEPTION (ADR-080 U1, owner).
 * ADR-021's law is that instruments on this estate are static once arrived;
 * the owner ruled that this artifact is alive, as the reference is. It is
 * scoped: only this object, only while it is on screen and the document is
 * visible, and it never captures the wheel or moves the page.
 */
export const BREATHE = 0.09;
export const BREATHE_HZ = 0.11;
export const FLICKER = 0.49;
export const TWINKLE = 0.57;

/** The intro draw-on. The one part of round 1 that worked: the rings arrive
 *  in DATE ORDER, so watching it build is watching the record happen. */
export const INTRO_MS = 2000;

export function ringReveal(at: number): readonly [number, number] {
  const each = 0.3;
  const start = at * (1 - each);
  return [start, start + each];
}

/* ── Post-processing (the reference's own numbers) ───────────────────── */

export interface HoloPost {
  bloom: number;
  bloomRadius: number;
  aberration: number;
  grain: number;
  vignette: number;
  dofFocusRange: number;
  dofBokeh: number;
}

/** ⚠ NOT `as const` — the lab drives these live from sliders, and literal
 *  types would make every override a compile error. */
export const POST: HoloPost = {
  /** ⚠ Bloom LIFTS the bright arcs; it must not melt the line work. The
   *  first cut ran intensity 0.9 against a 0.28 threshold and every hairline
   *  in the object bloomed into a white rope. */
  bloom: 0.6,
  bloomRadius: 0.7,
  /**
   * ⚠ THE FRINGE IS A SIGNATURE, NOT A REGISTRATION ERROR. Round 1 ran it at
   * 0.00012 (invisible); round 2 took the reference's own 0.0014 — but that
   * value is theirs for a picture with FEW bright bodies, and on an object
   * made of dozens of hairline rings it separated every line into red/green/
   * blue and read as a misprint. Halfway is where it fringes the accent arcs
   * and leaves the structure clean.
   */
  /**
   * ⚠ OFF, AND THAT IS A MEASUREMENT (2026-08-25). The reference runs .0016
   * and it works THERE because its bright bodies are few and large. This
   * object is dense fine line work plus a 2000-point cloud, and on those the
   * pass does not fringe an edge — it SEPARATES each mote and hairline into
   * distinct red and green marks, so the whole artifact read as coloured
   * confetti / a misprint. Captured with it on and off to be sure.
   * The lab's slider starts here, so it can be dialled back in by eye.
   */
  aberration: 0,
  grain: 0.07,
  vignette: 0.5,
  /** ⚠ DEPTH OF FIELD IS RETIRED (owner, 2026-08-25: "a bit too much blur").
   *  It was the most expensive pass and the one softening the whole object;
   *  a wireframe instrument wants its lines sharp. The fields stay so the
   *  lab can re-enable it for a comparison, but nothing reads them. */
  dofFocusRange: 0,
  dofBokeh: 0,
};

/** The kept-dark ground. Between the house void and the reference's slate,
 *  staying in the warm family. ⚠ A LITERAL: it does not flip with the theme
 *  (ADR-058 Lane 0 — a hologram reads on void). */
export const HOLO_PLATE = "#0d0c0a";
