/**
 * stageParticleShader — the material's two programs (ADR-140, round three;
 * the life dial and the disc since round four).
 *
 * The brandmark core's sprite library (`BrandmarkPhysicsCore/shaders.ts`:
 * dot · cell · voxel · glyph · dash), copied by hand and cut to what a figure
 * needs, over a vertex program that reads each particle's SIMULATED position
 * from the GPGPU texture the core runs on, blends it with the particle's own
 * HOME by its `order` (a lattice seats, a cloud rides), and runs the stage's
 * clocks — the intro, the reveal groups, the gold sweep front — per particle.
 *
 * ROUND FOUR ADDS LIFE. A seated bead with a tangent TRAVELS along it: `run`
 * slides it one tangent-length per period and wraps, so a line of identical
 * beads flows like a conveyor while the line itself stays put; `wander`
 * swings it on a sine. A second, quarter-strength front (`uRescan`) crosses
 * the plate every few seconds. The dial is `uLife`; at 0 the figure holds.
 *
 * ⚠ PREMULTIPLIED, like the batch. On dark the blend is One/One (additive, so
 * overlapping motes accumulate to the white-hot core the references have);
 * on paper it is One/OneMinusSrcAlpha, and every colour is the palette's INK.
 *
 * ⚠ NO DYNAMIC INDEXING OF UNIFORM ARRAYS IN THE FRAGMENT STAGE (GLSL ES 1.00
 * forbids it there), so the role colour is resolved in the VERTEX program by
 * an if-chain and handed down as a varying.
 */

export const stageParticleVertexShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uPositions;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uProgress;      // the intro clock 0..1
  uniform vec4  uGroups;        // reveal group clocks (index 1..4)
  uniform float uTime;
  uniform float uSeat;          // 0 = every particle rides the sim; 1 = ordered ones sit on home
  uniform bool  uSweepOn;
  uniform int   uSweepAxis;     // 0 along a (x) · 1 along b (-z) · 2 up (y)
  uniform float uSweep;         // the front's world coordinate
  uniform float uSweepWidth;
  uniform float uRescan;        // a second front, world coordinate (off-plate when idle)
  uniform float uRescanGain;    // its brightness against the arrival's
  uniform float uLife;          // 0 holds, 1 full travel and wander
  uniform vec3  uRoleColors[6]; // structure · machine · gold · green · grid · accent
  uniform vec3  uSweepColor;
  uniform float uLitGain;       // brightness of the lit population (passes bloom)
  uniform float uAlphaScale;    // the palette's dust dial (ink lifts on paper)
  uniform bool  uAdditive;

  /* ⚠ SEVEN ATTRIBUTES, NOT SIXTEEN. The GPU's limit is 16 vertex attribute
     locations and three.js's own 'position' takes one; fifteen scalars failed
     to link on the first shoot ("Too many attributes"). The scalars are
     packed into vec4s, and the home rides 'position'. */
  attribute vec2  aUV;
  attribute vec4  aMeta0;   // role · shape · size · alpha
  attribute vec4  aMeta1;   // seed · angle · order · drift (ordered: the flow period, <0 = wander)
  attribute vec4  aMeta2;   // group · lit · twinkle · sizeVar
  attribute vec2  aReveal;
  attribute vec4  aFlow;    // the travel vector (three-space, its length one step) · phase

  varying vec3  vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vAngle;
  varying float vSeed;
  varying float vFlash;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }
  float smoother(float e0, float e1, float x) {
    if (e1 <= e0) return x >= e1 ? 1.0 : 0.0;
    float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  void main() {
    vec3 aHome = position;
    float aRole = aMeta0.x;
    float aShape = aMeta0.y;
    float aSize = aMeta0.z;
    float aAlpha = aMeta0.w;
    float aSeed = aMeta1.x;
    float aAngle = aMeta1.y;
    float aOrder = aMeta1.z;
    float aDrift = aMeta1.w;
    float aGroup = aMeta2.x;
    float aLit = aMeta2.y;
    float aTwinkle = aMeta2.z;
    float aSizeVar = aMeta2.w;
    vec3 sim = texture2D(uPositions, aUV).xyz;
    /* A lattice seats exactly once the figure has assembled; a cloud keeps
       riding the simulation. In between, everything flies in on the sim. */
    float seat = aOrder * uSeat;
    vec3 pos = mix(sim, aHome, seat);
    /* Idle wander for cloud particles — slow, three incommensurate periods,
       never a loop the eye can lock onto. The life dial widens it. */
    float w = aDrift * (1.0 - aOrder) * (0.6 + 0.8 * uLife);
    if (w > 0.0) {
      float s = aSeed * 97.0;
      pos += w * vec3(
        sin(uTime * 0.31 + s) * 0.6 + sin(uTime * 0.77 + s * 1.7) * 0.4,
        sin(uTime * 0.23 + s * 2.3) * 0.5,
        sin(uTime * 0.41 + s * 0.7) * 0.6 + cos(uTime * 0.59 + s * 3.1) * 0.4
      );
    }
    /* LIFE for a seated bead with a tangent: a run flows (a saw along the
       tangent, wrapping one step), a shell wanders (a sine). The period rides
       the drift slot, which a seated particle never reads as drift. */
    float travel = dot(aFlow.xyz, aFlow.xyz);
    if (travel > 0.0 && aDrift != 0.0 && uLife > 0.0) {
      float settled = smoothstep(0.9, 1.0, seat);
      float k = aDrift > 0.0
        ? fract(aFlow.w + uTime / aDrift) - 0.5
        : sin((uTime / -aDrift + aFlow.w) * 6.2831853) * 0.5;
      pos += aFlow.xyz * k * uLife * settled;
    }

    /* The clock this particle reveals on. */
    float clock = uProgress;
    int g = int(aGroup + 0.5);
    if (g == 1) clock = uGroups.x;
    else if (g == 2) clock = uGroups.y;
    else if (g == 3) clock = uGroups.z;
    else if (g == 4) clock = uGroups.w;
    float r = smoother(aReveal.x, aReveal.y, clock);

    /* The sweep: nothing paints ahead of the front; at the front a flash.
       The re-scan is the same front again, fainter, and gates nothing. */
    float flash = 0.0;
    if (uSweepOn && g == 0) {
      float coord = uSweepAxis == 0 ? aHome.x : (uSweepAxis == 1 ? -aHome.z : aHome.y);
      /* 1 behind the front (the front has crossed this home), 0 ahead of it. */
      float passed = 1.0 - smoothstep(uSweep - uSweepWidth, uSweep, coord);
      r *= passed;
      float d = abs(coord - uSweep) / max(1e-4, uSweepWidth);
      flash = exp(-d * d * 2.0) * passed;
      float d2 = abs(coord - uRescan) / max(1e-4, uSweepWidth);
      flash += exp(-d2 * d2 * 2.0) * uRescanGain;
    }
    vFlash = flash;

    /* Twinkle, per particle, on a wall clock. */
    float tw = 1.0 - aTwinkle * 0.5 * (0.5 + 0.5 * sin(uTime * (1.1 + hash11(aSeed) * 2.4) + aSeed * 40.0));

    vec3 col = uRoleColors[0];
    int role = int(aRole + 0.5);
    if (role == 1) col = uRoleColors[1];
    else if (role == 2) col = uRoleColors[2];
    else if (role == 3) col = uRoleColors[3];
    else if (role == 4) col = uRoleColors[4];
    else if (role == 5) col = uRoleColors[5];
    /* The lit population is pushed past the bloom threshold on dark; on
       paper it is simply the palette's gold ink, never brighter than ink. */
    float gain = uAdditive ? mix(1.0, uLitGain, aLit) : 1.0;
    col *= gain;
    col = mix(col, uSweepColor * (uAdditive ? 2.2 : 1.0), min(1.0, flash) * 0.85);

    vColor = col;
    vAlpha = aAlpha * uAlphaScale * r * tw * (1.0 + flash * 0.6);
    vShape = aShape;
    vAngle = aAngle;
    vSeed = aSeed;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float sizeVar = 1.0 + aSizeVar * (hash11(aSeed * 3.7) - 0.5) * 1.6;
    /* Particles grow in as they reveal, and the flash swells them; the lit
       population draws a little larger on dark so its core can overlap. */
    float grow = pow(r, 0.6) * (1.0 + min(1.0, flash) * 0.5);
    float litSize = uAdditive ? mix(1.0, 1.15, aLit) : 1.0;
    gl_PointSize = max(0.0, aSize * sizeVar * litSize * uSizeScale * uPixelRatio * grow);
    if (vAlpha < 0.003) gl_PointSize = 0.0;
  }
`;

export const stageParticleFragmentShader = /* glsl */ `
  precision highp float;

  uniform bool uAdditive;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vAngle;
  varying float vSeed;
  varying float vFlash;

  float sdBox(vec2 p, vec2 b) {
    vec2 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  }
  vec2 rotByAngle(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    int shape = int(vShape + 0.5);
    float mask;
    float aa = 0.04;
    if (shape == 1) {
      /* CELL — an outlined square: a lattice you can count. */
      float outer = step(max(abs(c.x), abs(c.y)), 0.44);
      float inner = step(max(abs(c.x), abs(c.y)), 0.44 - 0.16);
      mask = clamp(outer - inner, 0.0, 1.0) + 0.18 * inner;
    } else if (shape == 2) {
      /* VOXEL — a hard lit face with a diagonal bevel. */
      mask = step(max(abs(c.x), abs(c.y)), 0.42);
      mask *= clamp(1.0 + (-c.x - c.y) * 0.5, 0.55, 1.4);
    } else if (shape == 3) {
      /* RING — an open node. */
      float sdf = abs(d - 0.34) - 0.07;
      mask = 1.0 - smoothstep(-aa, aa, sdf);
    } else if (shape == 4) {
      /* DASH — a stroke along the contour's tangent. */
      vec2 q = rotByAngle(c, -vAngle);
      float sdf = sdBox(q, vec2(0.46, 0.09));
      mask = 1.0 - smoothstep(-aa, aa, sdf);
    } else if (shape == 5) {
      /* CROSS — a registration mark. */
      float sdf = min(sdBox(c, vec2(0.44, 0.07)), sdBox(c, vec2(0.07, 0.44)));
      mask = 1.0 - smoothstep(-aa, aa, sdf);
    } else if (shape == 6) {
      /* DISC — a filled node with a hard edge and a breath of halo. */
      float body = 1.0 - smoothstep(0.36, 0.41, d);
      float halo = 1.0 - smoothstep(0.38, 0.5, d);
      mask = body + halo * 0.22;
    } else {
      /* DOT — the gyro's own crisp core with a short faint halo (the corridor
         dust's soft blob read as low-res at this density). */
      float core = 1.0 - smoothstep(0.14, 0.3, d);
      float halo = 1.0 - smoothstep(0.1, 0.5, d);
      mask = halo * 0.34 + core * 0.95;
    }
    float a = mask * vAlpha;
    if (a < 0.004) discard;
    /* Premultiplied: additive on dark accumulates to a white-hot core where
       motes overlap; on paper it composites as ink. */
    gl_FragColor = vec4(vColor * a, a);
  }
`;
