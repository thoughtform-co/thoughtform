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

**The ladder is MONOTONIC — the governor never steps up mid-session.** This is
deliberate: stepping up would re-detect slowness and oscillate. A session that
degrades stays degraded until reload. DPR steps are exhausted first because they
are free; the two count steps only ever fire on a device still slow after the
cheap levers are spent, and each fires at most once.

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

## References

- `lib/hooks/useQualityTier.ts`, `lib/webgl/rendererClass.ts`,
  `lib/hooks/useDeviceTier.ts` (`corridorCapable`),
  `components/landing/home-v2/DepthGatewayScene/index.tsx` (DPR + sampler).
- ADR-018 (home-v2 depth corridor; mount gate + glEpoch recovery this layers on).
- `landing-performance` skill (First Load JS budget; the governor is negligible).
