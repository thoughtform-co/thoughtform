/**
 * sampleArmillary — reinterpret the Thoughtform brandmark (a ring + a
 * cross) as a genuinely VOLUMETRIC 3D armillary artifact, and pair every
 * particle with BOTH a flat-glyph home and a 3D-armillary home so a single
 * `uFlyIn` uniform can morph the mark open.
 *
 * The flat state is the brandmark seen head-on (a circle + a plus). The
 * armillary state is the same particles redistributed into a 3D gimbal:
 *
 *   - RING particles (part 0) — the brandmark's circle. In the flat state
 *     they sit on one ring in the XY plane. In the armillary they SPLIT
 *     into two crossing great-circle bands (an equatorial band + a
 *     perpendicular meridian) so the single ring "opens" into a sphere of
 *     rings.
 *   - AXIS particles (part 1) — the brandmark's cross. Flat: a plus (a
 *     horizontal bar + a vertical bar) in the XY plane. Armillary: a 3D
 *     triad crosshair — one third stays on X, one third on Y, and one
 *     third LIFTS out of the plane onto the depth (Z) axis. That lift is
 *     the signature "it just became 3D" moment.
 *   - SHELL particles (part 2) — faint volumetric dust. Flat: scattered in
 *     a disc inside the glyph. Armillary: inflated onto a sphere shell so
 *     the artifact reads as a contained radar bubble rather than a wire
 *     cage. Rendered dim (low edge weight) so it never competes with the
 *     structure.
 *
 * Output is in WORLD units (radius ≈ `radius`, default 1), ready to drop
 * into a perspective R3F scene. No DOM dependency — pure math, so it runs
 * anywhere (unlike `sampleBrandmarkParticles`, which rasterises the SVG).
 *
 * This is the volumetric counterpart to the flat `sampleBrandmarkParticles`
 * bases (ADR-023). It does NOT replace them — the v7 journey painters keep
 * their pixel-native silhouette; this feeds the Services hologram centerpiece
 * where a real 3D read is the whole point.
 */

const TAU = Math.PI * 2;

export interface ArmillarySample {
  /** Flat-glyph home positions (the brandmark seen head-on). `count * 3`. */
  flatHomes: Float32Array;
  /** Armillary home positions (the volumetric 3D artifact). `count * 3`. */
  armHomes: Float32Array;
  /** Per-particle deterministic seed in [0, 1). Drives stagger + twinkle. */
  seeds: Float32Array;
  /** Part id: 0 = ring band, 1 = axis/crosshair, 2 = dust shell. `count`. */
  parts: Float32Array;
  /** Brightness/edge hint in [0, 1]. Structure = 1, shell ≈ 0.22. `count`. */
  edge: Float32Array;
  /** Number of particles actually generated. */
  count: number;
}

export interface SampleArmillaryOptions {
  /** Particles on the ring → great-circle bands. Default 1600. */
  ringCount?: number;
  /** Particles on the cross → 3D crosshair (rounded down to a ×3). Default 720. */
  axisCount?: number;
  /** Faint volumetric dust particles. Default 1300. */
  shellCount?: number;
  /** World radius of the artifact. Default 1. */
  radius?: number;
  /** Equatorial band tilt [rx, ry] in radians. Default [0.42, 0.26]. */
  ringTilt?: [number, number];
  /** Crosshair half-length as a multiple of `radius`. Default 1.18 (pokes
   *  through the ring like a navigational sight). */
  axisExtent?: number;
  /** PRNG seed for determinism. Default 1. */
  seed?: number;
}

/** Mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Vec3 = [number, number, number];

function rotateX([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}
function rotateY([x, y, z]: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

export function sampleArmillary(opts: SampleArmillaryOptions = {}): ArmillarySample {
  const radius = opts.radius ?? 1;
  const ringN = Math.max(0, Math.floor(opts.ringCount ?? 1600));
  const axisPer = Math.max(0, Math.floor((opts.axisCount ?? 720) / 2));
  const axisN = axisPer * 2;
  const shellN = Math.max(0, Math.floor(opts.shellCount ?? 900));
  const ringTilt = opts.ringTilt ?? [0.4, 0.15];
  const axisLen = radius * (opts.axisExtent ?? 1.1);

  const total = ringN + axisN + shellN;
  const flatHomes = new Float32Array(total * 3);
  const armHomes = new Float32Array(total * 3);
  const seeds = new Float32Array(total);
  const parts = new Float32Array(total);
  const edge = new Float32Array(total);

  const rand = mulberry32((opts.seed ?? 1) * 0x9e3779b1);

  let idx = 0;
  const push = (flat: Vec3, arm: Vec3, part: number, e: number) => {
    flatHomes[idx * 3] = flat[0];
    flatHomes[idx * 3 + 1] = flat[1];
    flatHomes[idx * 3 + 2] = flat[2];
    armHomes[idx * 3] = arm[0];
    armHomes[idx * 3 + 1] = arm[1];
    armHomes[idx * 3 + 2] = arm[2];
    seeds[idx] = rand();
    parts[idx] = part;
    edge[idx] = e;
    idx++;
  };

  // ── RING → two crossing great-circle bands ──────────────────────
  for (let i = 0; i < ringN; i++) {
    const theta = (i / ringN) * TAU;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Flat: one ring in the XY plane with a hair of radial / z jitter so
    // it reads as a drawn circle rather than a perfect vector.
    const fr = radius * (1 + (rand() - 0.5) * 0.02);
    const flat: Vec3 = [fr * cos, fr * sin, (rand() - 0.5) * 0.012 * radius];

    // Armillary: ONE ring — the brandmark's circle given real depth (a thin
    // tube + a modest tilt) so it reads as a dimensional 3D ring while
    // staying UNMISTAKABLY the brandmark, not an abstract crossing-band
    // gimbal. The armillary/space feel comes from the orbits wrapping it,
    // not from dissolving the mark's own identity.
    const tube = (rand() - 0.5) * 0.014 * radius;
    let arm: Vec3 = [
      radius * cos + cos * tube,
      radius * sin + sin * tube,
      (rand() - 0.5) * 0.03 * radius,
    ];
    arm = rotateX(arm, ringTilt[0]);
    arm = rotateY(arm, ringTilt[1]);
    push(flat, arm, 0, 1);
  }

  // ── CROSS → 3D triad crosshair ──────────────────────────────────
  // g0 stays on X, g1 stays on Y, g2 lifts the vertical bar into depth (Z).
  const axisGap = axisLen * 0.16; // clean reticle void at the crosshair centre
  // The crosshair is a clean 2D plus (the brandmark's cross) with only a
  // whisper of Z thickness. No dedicated depth-axis: the mark billboards to
  // face the viewer, so a Z arm would always point at the camera and collapse
  // into a clump. Dimensionality comes from the ring lean + the shell.
  for (let g = 0; g < 2; g++) {
    for (let k = 0; k < axisPer; k++) {
      // Two arms per axis with a centre gap (a HUD sight, not a solid bar).
      const side = k % 2 === 0 ? 1 : -1;
      const halfN = Math.max(1, Math.floor((axisPer - 1) / 2));
      const t = Math.floor(k / 2) / halfN;
      const u = side * (axisGap + t * (axisLen - axisGap));
      const j1 = () => (rand() - 0.5) * 0.02 * radius;
      const j2 = () => (rand() - 0.5) * 0.018 * radius;
      let flat: Vec3;
      let arm: Vec3;
      if (g === 0) {
        flat = [u, j1(), 0]; // horizontal bar
        arm = [u, j1(), j2()];
      } else {
        flat = [j1(), u, 0]; // vertical bar
        arm = [j1(), u, j2()];
      }
      push(flat, arm, 1, 1);
    }
  }

  // ── SHELL → faint disc inflating into a sphere bubble ────────────
  for (let s = 0; s < shellN; s++) {
    // Flat: a faint disc inside the glyph footprint.
    const rr = radius * 0.86 * Math.sqrt(rand());
    const ph = rand() * TAU;
    const flat: Vec3 = [rr * Math.cos(ph), rr * Math.sin(ph), (rand() - 0.5) * 0.03 * radius];

    // Armillary: a point on (just inside) a sphere shell — uniform on the
    // sphere via the z / azimuth method, pulled inward a little at random.
    const uu = rand() * 2 - 1;
    const ph2 = rand() * TAU;
    const ring = Math.sqrt(Math.max(0, 1 - uu * uu));
    const rad = radius * (0.8 + 0.2 * rand());
    const arm: Vec3 = [rad * ring * Math.cos(ph2), rad * ring * Math.sin(ph2), rad * uu];
    push(flat, arm, 2, 0.22);
  }

  return { flatHomes, armHomes, seeds, parts, edge, count: total };
}
