# Plan: Corridor-exit perf, wave 2

## Context

The 2026-07-29 perf pass (commit `ff72f04`, recorded in **ADR-056 Update 4**
and **ADR-038**'s 2026-07-29 addendum) took the corridor-exit → proof-casefile
transition from **89.5 ms/frame avg, p95 236 ms** down to **39.4 ms avg,
p95 48.5 ms, 52 ms worst frame** — the owner's "SUPER slow" report. That was
wave 1: the structural wins, all zero-visual-change.

Wave 2 is what was **scoped, costed and deliberately deferred** in that pass —
either because wave 1's numbers made them non-urgent, or because they need a
measurement / device pass wave 1 didn't have room for. Nothing here is
speculative: every item was traced to a specific mechanism during the
investigation, with the file, the reason it is safe, and the reason it was
held back.

**Current state to beat** (prod build, M2, 1600×900 @2x, `--workers=1`):

| segment                | avg      | p50  | p95  | max | long-task share |
| ---------------------- | -------- | ---- | ---- | --- | --------------- |
| corridor-mid           | 19.9     | —    | —    | —   | 0%              |
| **dissipate-approach** | **39.4** | 38.3 | 48.5 | 52  | 9%              |
| casefile-dwell         | 24.0     | 23.0 | 34.1 | 37  | 0%              |
| ring-zone              | 20.5     | 19.1 | 26.4 | 28  | 0%              |

`dissipate-approach` is the only segment still meaningfully above the rest,
and it is the one all the GPU-side items below target. It is now
**GPU-bound, not main-thread bound** — style recalc is flat across all four
segments (~0.6–0.8 s/wall-s) and long tasks are nearly gone, so the remaining
cost is fill rate and draw submission.

## The measurement gate

**Every item below is judged on numbers, not feel.** The harness is committed:

```bash
npm run build && npx next start -p 3010   # never build with the dev server running
node scripts/probe-corridor-frames.mjs --url http://localhost:3010 --runs 3
```

Dev-server runs (`node scripts/probe-corridor-frames.mjs`) are fine for A/B-ing
a single change — they track prod within ~15% — but quote prod numbers in any
ADR. The script's header documents the three rules it encodes (real GPU flags,
warm-scroll before measuring rects, progressive scroll never teleport); read it
before writing a new probe.

Ship gate for each item: `npm run verify` + `npm run build`, then
`npx playwright test tests/visual/landing-corridor-smoke.spec.ts
tests/visual/services-ring-smoke.spec.ts --workers=1`. **Known baseline:** the
desktop drawer-open test (`services-ring-smoke.spec.ts:286`) fails on
unmodified `main` — verified by stash-testing during wave 1. Judge against
that, and expect extra noise if you run multiple corridor pages concurrently
(headless GPU-context starvation; the spec's own serial-mode note covers it).

---

## Item 1 — Sprite quad trim (GPU, the big one)

**Where:** `components/landing/home-v2/DepthGatewayScene/shell/ShellSubstrateGyro.tsx`
— `gyroParticleVertex` (:161) / `gyroParticleFragment` (:182), and
`surfaceShellVertex` (:375) / `surfaceShellFragment` (:409).

**The mechanism.** Both point fragments paint _exactly nothing_ beyond
`d = 0.34` of the 0.5-half-width quad (core max radius 0.32, halo
`smoothstep(0.34, 0.10, d)`). So ~48% of every sprite's raster area is
guaranteed-zero fill that still costs rasterisation, a shader invocation and a
discard — across 6,720 dotted-shell sprites at up to ~70 device px each during
the fly-in, additive, `depthWrite: false`, under desktop MSAA. The measured
overdraw was 2.4–7× full-screen.

**The edit.** Introduce `const QUAD_TRIM = 0.72` (half-extent 0.36 — a 0.02
exactly-zero safety margin):

- vertex: `gl_PointSize = (existing expression) * QUAD_TRIM;`
- fragment: `vec2 uv = (gl_PointCoord - 0.5) * QUAD_TRIM;`

so the same physical pixel resolves to the same `d`. Output is
**pixel-identical** — the trimmed band only ever painted alpha 0 — while raster
area per sprite drops ~48%.

**Impact:** medium-big on the GPU-bound share; this is the highest-value
remaining item and the reason `dissipate-approach` is still the outlier.

**Risk:** low. The one real risk is driver point-size rounding at the smaller
size. **Verify by pixel-diff**, not by eye: capture parked corridor (dissipate
0), mid-scatter (~0.5) and the ambient bed (1.0) before and after; expect
identity modulo sub-pixel sprite-edge rasterisation. Check the interior cloud's
softness specifically at the deepest camera pose.

**Do NOT** apply this blindly to `components/brand/BrandmarkPhysicsCore` — its
fragment draws shape/glyph variants that may use the full quad. Audit that
radial profile separately before extending.

---

## Item 2 — Gyro counts on the ADR-038 count ladder

**Where:** `ShellSubstrateGyro.tsx` (the geometry `useMemo`),
`lib/hooks/useQualityTier.ts` (read-only import). Constants stay put:
`SUBSTRATE_GYRO_DOTTED_SHELL_COUNT_DESKTOP = 9600`
(`shell/shellGeom.ts:749`), `SUBSTRATE_GYRO_PARTICLE_COUNT_DESKTOP = 220`
(:730).

**The mechanism.** The governor's count ladder (1.0 → 0.6 → 0.35) governs
`LatentFieldTunnel`, `CelestialMotes`, `ScrollStreaks`, `ThoughtformAtmosphere`,
`LatentWormholeWalls`, `StaticStarfield` — and **all but the starfield are
already faded to zero during the dissipate**. The two painters that actually
cost anything in this window pick their counts from `reducedMotion`/`isMobile`
only, so the ladder cannot reach them.

**The edit.** Subscribe to the multiplier directly —
`const countMul = useQualityStore((s) => s.countMultiplier)` — and fold it into
the existing geometry memo (`round(base × particleDensity × countMul)`, floor
~120), adding `countMul` to the deps so a rung step rebuilds once. At
`countMultiplier === 1` the geometry is **byte-identical** (×1 before the same
round).

**Impact:** zero on capable hardware; medium on machines already degraded
_before_ the window (probe-seeded `low` tier, or a session that tripped the
ladder earlier). **Say this plainly in the PR** — the in-window EMA can never
react in time (ADR-038's 2026-07-29 addendum explains why that is by design),
so this is not a fix for the transition, it is relief for slow devices.

**Risk:** a rung step mid-view rebuilds the shell with fresh `Math.random()`
ranks/tints — a subtle sparkle repattern, the same accepted trade as the
already-governed painters. Verify no rebuild happens at multiplier 1 (deps
stable) and that the existing dispose path handles the geometry swap.

**Deferred sibling — do not bundle:** governing
`BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP` (6000). A count change re-inits the
GPGPU sim and re-seeds particle positions, visibly re-forming the flagship
mark mid-session. Needs a seeded-handoff design of its own.

---

## Item 3 — GPGPU noise early-out + per-frame allocations

**Where:** `lib/key-visual/gpgpu-simulation.ts` (the position shader, around
the `curlNoise` call at :134 and the turbulence block at :160) and
`components/brand/BrandmarkPhysicsCore/BrandmarkPhysicsCore.tsx:986`.

**The mechanism.** The sim runs 128×128 = 16,384 texels through **9 simplex-noise
evaluations each** (6 for `curlNoise` + 3 turbulence), every frame, regardless of
state. `calm` damps the _result_, not the evaluation — so the "centerpiece calm"
beat, where the mark is parked behind the casefile, costs exactly as much as
full motion. Separately, `{ ...IGNITE_OFF_FORCES, ...forces?.off }` allocates
two objects per frame.

**The edit.** Guard both noise blocks on their uniform:
`vec3 flow = vec3(0.0); if (uFlowStrength > 0.0) { flow = curlNoise(flowPos) * uFlowStrength; }`
and likewise for turbulence. Because `CLEAN_FIELD_FORCE_FLOOR = 0`
(`BrandmarkPhysicsCore.tsx:98`), at full clean-field and under `freezeMotion`
both strengths are **exactly 0.0** — so skipping is byte-identical, not
approximate. Uniform branches are coherent; no divergence cost. Then hoist the
two force spreads into a `useMemo` on `[forces]`.

**Impact:** small (16k texels is minor next to fill rate) — this mostly cleans
the dwell. Take it when you are already in these files.

**Explicitly not doing:** halving the sim rate during the dissipate. It
subtly changes the mark's micro-motion — a look trade for a small win, when the
exact early-out is free.

---

## Item 4 — CorridorArmillary anchor scratch buffers

**Where:** `components/landing/home-v2/DepthGatewayScene/CorridorArmillary.tsx:224`
(`SERVICES.map`) and :240 (`Object.entries(...)`).

**The mechanism.** Two arrays plus N objects allocated every frame while parked
(dissipate ≥ 0.88), even when the existing epsilon gate then skips the store
write. Pure GC pressure through the parked dwell.

**The edit.** Two persistent scratch arrays (current/last) of mutable records;
hoist `Object.entries(anchorsRef.features)` (stable key set) to a cached list;
write projections in place; run the epsilon compare on the scratch; allocate
fresh arrays **only when actually publishing** (store consumers need fresh
identities). Preserve insertion order and the existing epsilon logic exactly —
`ServicesDesignationLayer`'s re-render gating depends on it.

**Impact:** small. **Risk:** low, but it is easy to break the publish gate
while refactoring around it; the ring smoke covers the consequence.

---

## Item 5 — Unmount the hidden plate rack in ring mode

**Where:** `components/landing/home-v2/services/ServicesStage.tsx:243`
(`<ServicesPlateCluster …>`), hidden by `services.css:2706-2707`
(`.services-stage[data-card-ring="on"] .svc-rack`, `.services-scan-connectors`).

**The mechanism.** ~156 nodes stay mounted while `display: none` on the desktop
ring tier. Whether `display:none` subtrees pay style recalc on inherited-var
changes is Blink-version-dependent — the conditional mount removes the question.

**The edit.** `{!cardRingActive && <ServicesPlateCluster … />}`. `cardRingActive`
(:84) is already exactly "the CSS currently hides it"
(`SERVICES_CARD_RING && useHologramCanvas`, the same media query as the ring
mount — satisfying the ADR-029 same-gate rule), so mobile, PRM, the
resize-across-960px path and the flag-off rollback all keep the rack where it is
visible today.

**Flag for the owner in the PR:** the JSX comment says "Kept mounted in ring
mode". Its stated reason (mobile owns the accordion; CSS owns visibility) is
preserved by the gate, and this is _not_ one of the documented
render-stability keeps (those are the masthead intro crosses and LandingPage's
nested-root stability — both untouched). Still worth a sentence.

**Measure first, revert if flat.** Compare recalc node counts via the probe's
`style/s` column; if the delta is ~0, keep the tree quiet and drop the item.

---

## Item 6 — `will-change` audit

**Where:** `components/landing/home-v2/services/services.css`.

- **Remove** `:173` (`.services-stage__brandmark`, `will-change: transform,
opacity`): its painted children are `opacity: 0 !important` on the enhanced
  tier — the only tier where its transform animates — and the mobile tier is
  static. Pre-check: grep `home-v2.css` / `landing.css` for any rule re-showing
  `__canvas` / `__fallback` on desktop before deleting.
- **Keep** `:520` (`.services-masthead`, `will-change: opacity`). It is the
  correct promotion — it is what makes the dot-grids and the title glow raster
  once instead of per frame. Note its cost honestly (one viewport-sized layer
  held for the page's life) but do not remove it.
- `:1370` (`.svc-stack`) and `:2834` (rail register rows) are dead on the
  landing — zero runtime cost. Prune only as optional hygiene.
- **Do not prune** the `.services-cards` / `.services-orbit-map` /
  `.service-celestial-card` rules: `/test/services-demo`,
  `/test/brandmark-reflective` and `/test/services-cards` mount those components
  and share this sheet. Unmatched class rules cost effectively nothing here.

---

## Settled — do not relitigate

These were investigated in wave 1 and closed with reasons. Re-opening any of
them needs new evidence, not a fresh opinion.

- **FrameInvalidator pump gate.** Its unconditional `invalidate()` _is_ the
  ADR-018 v2 fix for the unreliable `demand → always` frameloop restart.
  Gating it recreates that bug for a negligible win.
- **Brightness / density / timing levers** — `sizeFactor` cap, rank thinning,
  alpha compensation. All effective, all visibly change an owner-approved
  beat. Needs explicit sign-off with before/after captures, never a silent
  include.
- **Per-painter or in-window DPR moves.** DPR is canvas-wide and ADR-038 owns
  it; a mid-window drop is a visible resolution shift during the choreography.
- **A governor spike fast-path.** Contradicts ADR-038's deliberate EMA /
  cooldown design and would fire mid-choreography on mid-tier machines. Its own
  ADR if ever wanted.
- **The iris → cover-panel restructure.** The iris reveals the _live WebGL
  bed_; opaque covers cannot reproduce that backdrop, and the smoke parses the
  clip-path serialisation ADR-056 U2 pins.
- **`contain: paint` on `.fl-case`.** The reticles overhang the border box —
  exactly the amputation ADR-056 U2 already fixed once.
- **Re-enabling `content-visibility` during the exit**
  (`home-v2.css:335-347`). Its paint containment clips even fixed descendants
  to the `#services` border box, re-cutting the hard edge over the dissipating
  sphere — recorded three times. And it would buy nothing: the attribute is
  live precisely while `#services` is on screen, where `auto` renders anyway.
- **Retuning any release-ramp reading** (`SIGNAL_OUT`, `PROOF_*`, `REVEAL_AT`,
  `PROOF_OWNS_BELOW`, `TICKER_GONE_AT_DISSIPATE`). They are values _on_ a ramp
  — see `.claude/rules/proof.md`. Retune the ramp, re-measure the readings.
- **HudNav's decode re-fire at release 0.75.** Bounded (~0.9 s, two small text
  nodes) and an owner-validated beat. Left alone.

---

## Process

Cycle A per [sentinel/MAINTENANCE.md](../../sentinel/MAINTENANCE.md) after each
item. If item 1 or 2 lands, add the numbers to **ADR-056 Update 4**'s table and
note the count-ladder wiring in **ADR-038** (its addendum already flags it as
the open wave-2 option).
