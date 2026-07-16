# ADR-038: Corridor quality governor — device-tier & runtime degradation contract

**Status:** Accepted
**Date:** 2026-07-14
**Context:** Phase 4 device-hardening of the 2026-07-14 sweep. Sweep B found the
corridor's WebGL fundamentals solid (DPR caps, thorough disposal, dt clamping,
demand-frameloop pumps, context-loss recovery) but MISSING an adaptive layer:
`corridorCapable()` gated only WebGL-yes/no + cores + RAM + a 360px floor (so
every WebGL phone ran the full 2-canvas 3D corridor), and per-tier budgets were
static (a 20fps device had no recovery path).

## Context

Two capability signals were unused:

1. **The GPU renderer string** (`WEBGL_debug_renderer_info`). A software
   rasterizer (SwiftShader / llvmpipe / Microsoft Basic Render) will render the
   corridor, but at guaranteed-jank framerates — it should route to the static
   fallback, not the 3D corridor.
2. **Live frame time.** The width tier is a proxy for capability; the actual
   device may be slower (thermal throttle, weak integrated GPU, a heavy tab).
   Nothing measured the corridor's real framerate or shed load when it dropped.

The width tier (`lib/hooks/useDeviceTier.ts`) sets the STARTING budget. This ADR
adds a governor that adapts that budget to actual capability and framerate,
WITHOUT touching the mount gate or the parts sweep B found already-good.

## Decision

A quality governor in `lib/hooks/useQualityTier.ts` (store + hooks) plus a
one-shot renderer classifier in `lib/webgl/rendererClass.ts`.

### 1. GPU-capability probe (once per session)

`classifyRenderer()` reads the unmasked renderer and returns
`software | low | ok | unknown` (conservative: unreadable → `ok`, never
strands a capable device). It caches one throwaway context.

- **`software`** → `corridorCapable()` returns `false` → the STATIC text
  corridor. This is the one place the probe feeds the mount gate; it does not
  otherwise replace `corridorCapable()`'s WebGL / cores / RAM / 360px checks.
- **`low`** (known-weak-but-real GPU family) → the governor OPENS a couple of
  rungs down (DPR ceiling 1.25, count multiplier 0.6) so the device starts at a
  lighter budget instead of discovering it through dropped frames.
- **`ok` / `unknown`** → full budget.

### 2. Frame-time governor (monotonic ladder)

A single early sampler — `reportFrameSample(delta)` called from
`MotionFollowerDriver`'s `useFrame` (priority −10, the earliest engaged tick,
already holding the clamped R3F delta) — maintains a module-scope EMA of frame
time (no store writes, no re-render, no allocation per frame). When the smoothed
frame time stays above **24 ms** for **1200 ms** (with a **1500 ms** cooldown
after each step and on each fresh engage), the governor steps DOWN one rung:

```
DPR ceiling 1.75 → 1.25 → 1.0     (cheap; R3F reactive dpr prop, no rebuild)
THEN count multiplier 1.0 → 0.6 → 0.35   (rebuilds governed geometry once)
```

**The DOWN ladder was originally MONOTONIC — the governor never stepped up
mid-session** (a session that degraded stayed degraded until reload). DPR steps
are exhausted first because they are free; the two count steps only ever fire on
a device still slow after the cheap levers are spent, and each fires at most
once. **This monotonic-down invariant is superseded by rev 2 below** (recovery),
which re-introduces controlled step-UP behind a wide deadband + per-rung lock so
it cannot oscillate the way a naive step-up would.

### 3. How consumers read it

- **DPR:** `DepthGatewayScene` subscribes to `useDprCeiling()` (a store
  selector) so a step-down re-renders and R3F re-applies the pixel ratio with no
  Canvas remount. Mobile still clamps to 1.4 via `effectiveDprCeiling(tier, …)`.
- **Counts:** the per-painter `pickCount(desktop, tablet, mobile)` pattern is
  replaced by `useCorridorCount(desktop, tablet, mobile)` (heavy painters:
  `LatentFieldTunnel`, `CelestialMotes`, `StaticStarfield`, `ScrollStreaks`; and
  the fixed `STAR_COUNT`/`STREAK_COUNT` via the tier-gate commit). It returns
  `round(base × countMultiplier)`, subscribes to the multiplier, and reads the
  width tier. At `countMultiplier === 1` it returns the exact per-tier value, so
  **the corridor is byte-identical at full quality — desktop never degrades and
  is unaffected.** The consuming geometry `useMemo`s already depend on the count,
  so a multiplier step rebuilds them.

## Update — rev 2: bidirectional recovery (2026-07-15)

**Problem.** The monotonic-down design meant the heavy scroll-dive — the one
place a _capable_ desktop can briefly dip below ~42fps — could trip a DPR
step-down, and that step-down then persisted through the calm parked #services
state for the rest of the session. The flagship brandmark wireframe (the
`BrandmarkPhysicsCore` point cloud, sized by `uPointSize × uPixelRatio`) is a
thin dotted instrument; rendered at a stuck DPR 1.0 on a 2× retina panel it
upscales ~2× and reads visibly low-res / aliased. Reported as "sometimes the
wireframe looks low quality" — "sometimes" = "the sessions where the dive
tripped the governor."

**Decision.** The governor now climbs back UP one rung when the smoothed frame
time stays **below `FAST_MS` (14ms, ~72fps)** for **`RECOVER_SUSTAIN_MS`
(3000ms)**. Recovery **reverses** the ladder (counts back first, then DPR) and
is **clamped to the opening budget** (`maxDprCeiling` / `maxCountMultiplier`,
seeded by the probe: `ok/unknown` → 1.75/1.0, `low` → 1.25/0.6, `software` →
pinned at the floor so it never recovers). Because the recovery threshold sits
in a **wide deadband** under the 24ms degrade threshold and each step-up is
followed by its own `RECOVER_COOLDOWN_MS`, a step-up cannot immediately
re-cross into "slow".

**Anti-oscillation (the reason the original was monotonic).** If a step-up _is_
unsustainable — a degrade fires within `LOCK_WINDOW_MS` (4000ms) of it — that
rung is **locked**: `degrade(causedByRecovery=true)` lowers the recovery ceiling
to the degraded value, so the governor never retries it. Result: **at most one
up→down flip per rung per session**, then it settles. In the common case (a
capable machine that only dipped on the dive) it climbs straight back to 1.75
once parked and stays there. Recovery only fires while engaged (the sampler runs
under `frameloop="always"`), so it happens in the calm parked/hero states, not
mid-dive.

Sentinel: sentinel of the sentinel — the `-Infinity` "no step-up yet" sentinel
matters (a `0` sentinel would flag the first-ever degrade as recovery-caused
when `performance.now()` is still near zero, wrongly locking the top rung).
Invariants pinned in `tests/lib/quality-governor.test.ts` (reverse-order +
budget clamp + lock). At `countMultiplier === 1` the corridor is still
byte-identical at full quality.

## Consequences

### Positive

- Software renderers get the readable static corridor, not a slideshow.
- Weak GPUs open at a sane budget; struggling devices recover framerate instead
  of sustaining jank, via the cheapest lever first.
- Zero cost at full quality: the sampler is allocation/re-render-free, the probe
  is a no-op for normal GPUs, and every governed count equals its old value when
  the multiplier is 1.

### Negative / trade-offs

- A count-multiplier step-down rebuilds all governed geometry in one frame — a
  one-time hitch. Accepted: it is gated behind exhausting the DPR steps AND
  sustained slowness, fires at most twice, never on desktop, and trades a single
  hitch for recovered framerate on a genuinely struggling device.
- Making counts reactive means a width-tier change (rare mid-corridor resize
  across 760/1280) now rebuilds geometry where before it waited for a `glEpoch`
  remount. Low-risk and arguably more correct.
- The `low`-GPU marker list is intentionally small/specific to avoid demoting
  mid-range parts; it errs toward `ok`.

## Update (2026-07-16) — the raw-DPR `uPixelRatio` bug, second half of the low-res report

Rev 2 fixed the _persistence_ half of "sometimes the wireframe looks low
quality" (a stuck 1.0 ceiling now recovers). The remaining half was a consumer
bug: `BrandmarkPhysicsCore` pinned its point-size uniform once at mount from
**raw** `window.devicePixelRatio` (`min(dpr, 2)` → 2 on retina) while the
corridor canvas renders at the governed ceiling (1.75 → 1.0 under load). After
a step-down, dots were sized for a 2× buffer inside a 1× buffer — fat, chunky,
aliased. It was the **last** corridor painter off the governed idiom.

Fix: the uniform now syncs **per frame** from `state.viewport.dpr` in the
component's `useFrame` (the same recipe as the BrandmarkSilhouettePoints
2026-07-15 mobile pass), so a governor step lands in the shader the same frame;
the mount-time raw read and the resize listener are deleted.

**Consumer contract:** any painter that sizes points as
`uPointSize * uPixelRatio` MUST feed `uPixelRatio` from `state.viewport.dpr`
(or `gl.getPixelRatio()`) per frame — never from `window.devicePixelRatio` —
or a governed step-down renders it broken instead of merely softer. A grep for
`devicePixelRatio` under `components/landing/home-v2` + `components/brand`
should stay empty of per-painter reads.

The 2026-07-16 seam perf pass (ADR-047 U5) also removed most of the load that
tripped the governor on this dive: post-change traces (1280×800, full budget)
went from p50 ≈ 21–25ms / p95 ≈ 50–58ms / up to 13 long tasks to p50 16.7ms /
p95 ≈ 38–42ms / ~0 long tasks, so the step-down itself should now be rare on
capable hardware. No governor constants changed — the rev 2 ladder + lock
rules stand.

## References

- `lib/hooks/useQualityTier.ts`, `lib/webgl/rendererClass.ts`,
  `lib/hooks/useDeviceTier.ts` (`corridorCapable`),
  `components/landing/home-v2/DepthGatewayScene/index.tsx` (DPR + sampler).
- ADR-018 (home-v2 depth corridor; mount gate + glEpoch recovery this layers on).
- `landing-performance` skill (First Load JS budget; the governor is negligible).
