# Thoughtform.co Best Practices

> Patterns learned from real bugs in this codebase. These prevent classes of issues, not prescribe specific solutions.  
> **2026-04-25 audit:** cross-links to ADRs added where decisions exist; scroll/canvas/auth sections remain current. For **fixed elements + ScrollTrigger**, see [DOM Pinning & ScrollTrigger](#-dom-pinning--scrolltrigger-brandmark--fixed-actors) and [ADR-010](decisions/010-brandmark-choreography.md).

---

## Table of Contents

- [Scroll Animation Patterns](#-scroll-animation-patterns)
- [DOM Pinning & ScrollTrigger (brandmark / fixed actors)](#-dom-pinning--scrolltrigger-brandmark--fixed-actors)
- [Canvas & Three.js](#-canvas--threejs)
- [Authentication](#-authentication)
- [CSS & Styling](#-css--styling)
- [State Management](#-state-management)
- [After a non-trivial fix](#-after-a-non-trivial-fix)
- [Quick Checklist](#-quick-checklist)

---

## 🎬 Scroll Animation Patterns

> **Related:** [ADR-002](decisions/002-scroll-animation-architecture.md), [ADR-005](decisions/005-scroll-captured-content-reveal.md). If the element is `position: fixed` and **tracks** the page, also read [DOM Pinning & ScrollTrigger](#-dom-pinning--scrolltrigger-brandmark--fixed-actors).

### Sync Animation Timing to Shared Constants

When multiple elements animate together, sync to shared timing constants:

```typescript
// ❌ BAD: Each element has its own timing
// Sigil
const sigilFadeStart = 0.2;
const sigilFadeEnd = 0.5;

// Wordmark (different timing = out of sync)
const wordmarkFadeStart = 0.15;
const wordmarkFadeEnd = 0.45;

// ✅ GOOD: All elements reference same constants
const TRANSITION_START = 0.15;
const TRANSITION_END = 0.4;

// Sigil uses these
const sigilOpacity = 1 - normalize(scrollProgress, TRANSITION_START, TRANSITION_END);

// Wordmark uses same values (slight offset for lead-in is OK)
const wordmarkOpacity = 1 - normalize(scrollProgress, TRANSITION_START - 0.03, TRANSITION_END);
```

**Why it matters:** Animations feel "off" when elements don't move together. Shared constants ensure sync.

---

### Batch DOM Reads in Single rAF

Multiple `getBoundingClientRect()` calls cause layout thrashing:

```typescript
// ❌ BAD: Multiple layout reads per frame
useEffect(() => {
  const handleScroll = () => {
    const rect1 = element1.getBoundingClientRect(); // Layout read
    const rect2 = element2.getBoundingClientRect(); // Another layout read
    const rect3 = element3.getBoundingClientRect(); // Yet another
    // Browser may recalculate layout 3 times
  };
}, []);

// ✅ GOOD: Single rAF batches all reads
useEffect(() => {
  let frameId: number;

  const measure = () => {
    // All reads happen in same frame
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    const rect3 = element3.getBoundingClientRect();

    // Then do all writes
    updateAnimations(rect1, rect2, rect3);

    frameId = requestAnimationFrame(measure);
  };

  frameId = requestAnimationFrame(measure);
  return () => cancelAnimationFrame(frameId);
}, []);
```

**Why it matters:** Layout thrashing causes jank. Batch reads, then batch writes.

---

### Reset State When Scrolling Back

When transitions are reversible, reset state on reverse:

```typescript
// ❌ BAD: State persists when scrolling back
if (tDefToManifesto > 0.9) {
  setManifestoActive(true);
}
// User scrolls back but manifesto stays active!

// ✅ GOOD: Reset on reverse
if (tDefToManifesto > 0.9 && !manifestoComplete) {
  setManifestoActive(true);
} else if (tDefToManifesto < 0.9) {
  setManifestoActive(false);
  setManifestoProgress(0);
}
```

**Why it matters:** Users expect scrolling back to "undo" the transition.

---

### Cross-writer scroll state needs an owner and a release guard

When two scroll hooks share one visual state, one hook must own the state and
the other hook must verify that the owner's DOM/runtime gate is still true
before carrying it forward.

For the home-v2 corridor, `useEmbeddedServicesScroll` is the only writer that
can set the dock handoff. `useDepthScroll` may preserve that value while the
stage is still engaged, but it must clear stale dock state when the user
scrolls back before the dock window or when `data-corridor-docked` is no
longer present.

**Runtime check:** sample the page after `corridor mid -> dock window ->
pre-dock back -> corridor mid back`. The corridor canvas and brandmark should
remain mounted; `data-corridor-docked` should be absent before the dock window;
the canvas should return to `position: absolute` inside the sticky stage.

**Why it matters:** A stale boolean from a later handoff can keep an earlier
scroll scene in the wrong CSS layer or camera pose. The user experiences that
as "it vanished until refresh," even though the DOM nodes are still present.

---

### Exponential blends never reach their target — snap them, and gate branches with an epsilon

An exponential follower (`x += (target - x) * (1 - exp(-dt/tau))`) asymptotes
toward its target but **never reaches it exactly**. If a render branch is gated
on that value being `> 0`, the branch stays active forever on a sub-perceptual
residual.

This shipped as a corridor bug: `FlyingCameraRig.dockBlend` eased toward 0 after
a services-dock visit but kept a residual `~1e-10`, so `ep` stayed `> 0` and the
camera kept using the **epilogue pose**. `getEpilogueCameraPose(~0)` returns
`CAMERA_END`, so after scrolling back to a mid-corridor station the camera was
pinned to the corridor's _end_ distance — the substrate gimbal filled the
viewport and read as a structureless point cloud (and the walls dropped out)
until a full refresh reset the ref. Every scalar (follower reveals, opacities,
geometry buffers, scales) was byte-identical to a fresh load; only the camera Z
differed, which is why measuring scene-graph values alone never explained it.

```ts
// ❌ residual keeps the branch alive forever after a dock visit
dockBlend.current += ((docked ? 1 : 0) - dockBlend.current) * k;
const ep = smoothedEp + (DOCKED_POSE - smoothedEp) * dockBlend.current;
if (ep > 0) return epiloguePose(ep); // CAMERA_END at ep≈0

// ✅ snap to exactly 0 when the source condition is fully off, gate with epsilon
dockBlend.current += ((docked ? 1 : 0) - dockBlend.current) * k;
if (!docked && smoothedEp <= 1e-4) dockBlend.current = 0;
const ep = smoothedEp + (DOCKED_POSE - smoothedEp) * dockBlend.current;
if (ep > 1e-4) return epiloguePose(ep);
```

Keep the branch boundary **continuous** so the snap can't pop:
`getCameraPosition(1) === CAMERA_END === getEpilogueCameraPose(0)`.

**Debug recipe:** when a re-entered scroll scene renders wrong but every
JS-computed value matches a fresh load, suspect a stale GL/transform value, not
the scene graph. Sample the **camera** (`state.camera.position`/`fov`) fresh vs.
returned at the _same_ scroll position — a mismatch there with matching
follower/store values points straight at a camera-pose branch.

**Why it matters:** Asymptotic blends + `> 0` branch gates are a silent
"sticks until refresh" trap. Snap on the off-condition and gate with an epsilon.

---

### Keep the render loop alive while a demand-mode scene is engaged

A `frameloop="demand"` R3F canvas does not reliably resume continuous rendering
by toggling the prop back to `"always"`, and invalidating only on store
_changes_ lets the loop die the moment the user stops scrolling — freezing every
per-frame accumulator (motion followers, opacity ramps, idle spin) at its last
value. While the scene is engaged (on screen), pump `invalidate()` every
animation frame and stop only when it fully disengages. See `FrameInvalidator`
in `components/landing/home-v2/DepthGatewayScene/index.tsx`.

---

### Per-frame `dt` from `clock.elapsedTime` MUST be clamped to ≥ 0 — frameloop toggles reset the clock

R3F **resets `clock.elapsedTime` to 0** whenever the Canvas `frameloop` prop
toggles between `"always"` and `"demand"`. The home-v2 corridor flips that prop
every time it engages/disengages on scroll (`frameloop={engaged ? "always" :
"demand"}`), so the clock resets on every scroll-back. Any painter that derives
its frame delta as `dt = clock.elapsedTime - lastTime` then sees a large
**negative** `dt` on the first frame after a reset (a small `now` minus a stale
large `lastTime`).

A negative `dt` is catastrophic for an **exponential follower**:
`k = 1 - exp(-RESPONSE * dt)` becomes a large negative number, which turns
`ref += (target - ref) * k` into a positive-feedback loop. This shipped as the
"corridor walls vanish on scroll-back (sphere is fine)" bug: `LatentWormholeWalls`'
`opacityRef` blew up to `±1e60` in a single frame. Because
`uOpacity = min(1, opacityRef) * buildFade`, a negative `opacityRef` made every
wall point's alpha negative → discarded → walls gone, and the filter took
hundreds of frames to crawl back (or never, if re-kicked) — "gone until refresh".

The tell was the **asymmetry**: the sphere/camera (`FlyingCameraRig`) recovered
but the walls didn't — because the camera already clamped `Math.max(0, delta)`
while the walls clamped only the upper bound (`Math.min(0.1, now - lastT)`).

```ts
// ❌ upper-bound only — negative dt after a clock reset destabilizes the filter
const dt = lastT < 0 ? 0 : Math.min(0.1, now - lastT);

// ✅ clamp both ends — a clock reset costs one zero-dt frame, never a blowup
const dt = lastT < 0 ? 0 : Math.max(0, Math.min(0.1, now - lastT));
```

Rule: any `dt` fed into a per-frame integrator (followers, phase accumulators,
spawn/life timers) must be clamped to `[0, cap]`. Fixed across
`LatentWormholeWalls`, `CorridorPhotons`, `CelestialMotes`, `LatentFieldTunnel`,
and `ScrollStreaks`.

**Runtime check:** sample `opacityRef` (or any follower) across a continuous
services→corridor→services round-trip; it must stay within its physical range
(`[0, ~1]`) and never go non-finite. A value like `-4e60` is filter divergence,
not a scene-graph error.

---

### Cover Swipes Are Replacement Planes, Not Fade-Outs

For Active Theory / Hashgraph-style handoffs, keep the completed scene as a
fixed backdrop and let an opaque incoming section plane physically cover it.
Do not make the old scene disappear with `opacity`, and do not put the next
section's first-read copy after the 100svh cover viewport.

The first-read content must live inside the cover plane and become visible
during the sweep. The old scene may get a small transform to feel like depth,
but the cover, not a fade, must own the replacement.

**Runtime check:** sample the handoff with Playwright at cover progress
around `0.35`, `0.65`, and `0.9`. The docked canvas opacity should still be
`1`; the incoming copy should already have a viewport rect inside the pinned
cover.

**Why it matters:** A fading old canvas plus late incoming copy reads as
ordinary parallax and can produce a blank dark interval, which is the opposite
of a swipe/sweep replacement.

**Two valid exits from a held R3F backdrop (ADR-021):** the cover-plane sweep
above (incoming opaque plane covers the held canvas) and the
**zoom-dissipate** (camera flies INTO the held object, surface particles
scatter, destination section is already in place). Both share the same
infrastructure — single-writer `docked` / `dockProgress` channel, ADR-008
transparent-leading-viewport exception, reverse-scroll release gate,
mobile / reduced-motion fallback. The production corridor→Services seam ships
the zoom-dissipate; the lab routes (`/test/handoff-a|b|c`) + the
`components/landing/home-v2/handoff-lab/` recipe ship the cover-plane sweep.
Reuse the appropriate recipe verbatim — do not invent a third hybrid that
fades the canvas with `opacity`.

---

## 🧷 DOM Pinning & ScrollTrigger (brandmark / fixed actors)

> See also: [ADR-010](decisions/010-brandmark-choreography.md), `.claude/skills/brandmark-choreography/SKILL.md`.  
> These patterns came from `useSigilChoreography` and apply whenever a `position: fixed` element tracks a scrolling target.

### Sticky elements + JS pinning don't compose naively

A **precomputed sticky viewport coordinate** (or “where sticky _should_ be”) is not the same as where the **live** target paints this frame. Pin the fixed overlay to a **live rect** (per-frame / per-`onUpdate` read) so engagement of `position: sticky` is reflected. Otherwise the actor can hover over “empty” space between sections.

**Why it matters:** Sticky is stateful; a coord derived from layout math without the same state machine as the browser will drift.

### Let source elements own rest states

A **`position: fixed`** overlay is the wrong owner for a brandmark that is supposed to be part of a scrolling diagram. Use the native source element for the rest/read state, and only switch to the fixed actor for actual travel between stations.

For section 02, `.sigil__mark img` is visible and owns the diagram mark. `.tf-brandmark-actor` stays hidden through hero, entrance, and the parked/read state. At handoff, capture the live source rect, hide the native source, and let the actor travel to the HUD.

**Why it matters:** A fixed overlay can drift independently from a relative diagram and feel like a sticky element, even if its viewport coordinate is mathematically stable. If the user expects “locked in the diagram,” the DOM source inside the diagram should own that visual state.

### Scale-around-centre wobbles bounding-box edges

If a source node **animates `transform: scale()`** (e.g. entrance reveal), `getBoundingClientRect()` on that node moves the **edges** in non-obvious ways. For positioning a **separate** fixed element, read position from a stable horizontal reference (e.g. untransformed **container** width) and/or derive vertical from the **unscaled** box (centre-based math). If the fixed actor must not “breathe,” **force render scale = 1** on the actor while the source scrubs.

**Why it matters:** Coupling a fixed actor’s position to a scaled rect creates slow drift or jitter across long scroll ranges.

### Capture-at-`onEnter` rects are stale for sticky targets

`ScrollTrigger` `onEnter` can fire **before** sticky has engaged. If you capture `getBoundingClientRect()` once and reuse it for a **later** `onUpdate` / dock step, the stored rect can be wrong by hundreds of pixels. For `sticky` / `fixed` targets inside scroll portlets, **recompute live rects** in the same phase that applies the transform (e.g. forward travel into orbit uses live HUD + orbit reads).

**Why it matters:** “Snap” glitches on practice/orbit transitions are often stale measurements, not easing.

### Fast scrolls outrun `scrub: 0.4`

Short scrub values feel responsive but **may not complete** a timeline before the user leaves the trigger. If `onUpdate` is the only place that finalises **dock state** or boolean flags, **add `onLeave` / `onRefresh` handling** to settle the same state so fast scrolls don’t leave the machine half-docked.

**Why it matters:** Sticky flags (`practiceEntryArmed`, etc.) and the visible actor position can desync from ScrollTrigger’s progress.

---

## 🎨 Canvas & Three.js

### An always-frameloop canvas burns GPU even when its painters draw nothing

A full-viewport R3F canvas with `frameloop="always"` pays a clear +
composite every frame at its DPR **even if every mesh inside is
`visible = false`**. The global brandmark canvas shipped this way: WebGL
draw-call probes showed its painters issued **zero draw calls anywhere
on the live route** (the corridor actors own every visible beat), yet it
cleared ~45 fps for the whole session.

The fix pattern (2026-07-06, `BrandmarkFrameDriver`): a **constant**
`frameloop="demand"` plus a store-driven pump —

- every store write (scroll/resize/visibility recompute) → one
  `invalidate()`;
- a self-sustaining rAF pump runs **only while a time-animated term is
  visibly non-zero** (mirror the painters' own `VISIBILITY_EPSILON`
  gates — e.g. `dispersion > ε`, silhouette painting outside the
  substrate handoff);
- never toggle the `frameloop` prop itself (see the clock-reset trap
  above); the corridor's `FrameInvalidator` and the brandmark's
  `BrandmarkFrameDriver` are the two house instances of this pattern.

**Runtime check:** patch `WebGL(2)RenderingContext.prototype.clear` +
`drawArrays/drawElements` in a headless page, attribute calls to a
canvas via `ctx.canvas.closest(...)`, and sample parked/idle states A/B
against the pre-change build. Idle frames should be ~0 wherever nothing
time-animated is visible; draw calls must be identical pre/post (a draw
delta means the change was NOT perceptually invisible).

**Why it matters:** "the painters are cheap" is not the question — the
frameloop itself is the cost. Demand mode with a correct wake contract
is byte-identical on screen and free when idle.

---

### SSR data fetches need a timeout and a greppable fallback reason

Any `await` in a server component's render path is a page-load
hostage: `getCelestialSlots()` had no timeout, so a black-holed
Supabase connection (stale project URL, VPN, captive portal) hung the
entire localhost render forever — while production, with working
networking, was fine. Silent `catch → fallback` made the opposite
failure invisible: localhost rendered seed content with only a buried
`console.warn`, reading as "localhost shows different content than
Vercel."

Pattern (2026-07-06):

```ts
const raced = await Promise.race([query, timeout(3500, TIMEOUT)]);
if (raced === TIMEOUT) {
  warnFallback("timeout");
  return seed();
}
// every fallback path logs one stable line:
// [getCelestialSlots] fallback reason=env-missing|db-error|empty|timeout|exception
```

- API routes that serve fallback bodies with a 200 add an
  `x-thoughtform-fallback: <source>` response header so the Network
  panel can tell degraded from healthy without a client change.
- Dev boots get the env doctor (`reportDevEnvHealth`,
  `instrumentation.ts`): missing keys become a `console.error` + an
  on-page chip instead of silently different content.
- Production behavior stays graceful — the fix is observability, not
  strictness.

**Why it matters:** the "works on Vercel, not on localhost" bug class
is almost always a silent fallback firing on one side only. Make the
fallback loud where a human is watching and bounded where it can hang.

---

### Error Boundaries for Canvas

Canvas/WebGL can throw for many reasons (context lost, memory, etc.):

```typescript
// ✅ GOOD: Wrap canvas in error boundary
<CanvasErrorBoundary fallback={<StaticFallback />}>
  <ParticleCanvasV2 />
</CanvasErrorBoundary>

// CanvasErrorBoundary.tsx
class CanvasErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[Canvas Error]', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

**Why it matters:** Canvas errors shouldn't crash the entire page.

---

### Dispose Three.js Resources

Three.js objects must be manually disposed:

```typescript
// ❌ BAD: Memory leak
useEffect(() => {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial();
  const points = new THREE.Points(geometry, material);
  scene.add(points);
}, []);

// ✅ GOOD: Cleanup on unmount
useEffect(() => {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial();
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return () => {
    scene.remove(points);
    geometry.dispose();
    material.dispose();
  };
}, []);
```

**Why it matters:** GPU memory leaks crash browsers on mobile.

---

## 🔐 Authentication

### Always Validate Server-Side

Never trust client state for protected operations:

```typescript
// ❌ BAD: Trusting client assertion
export async function POST(request: Request) {
  const { isAdmin } = await request.json();
  if (isAdmin) {
    // Do admin thing - INSECURE!
  }
}

// ✅ GOOD: Validate token server-side
export async function POST(request: Request) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Now safe to do admin thing
}
```

**Why it matters:** Client state can be spoofed. Server must verify.

---

### Use Centralized `isAllowedEmail()`

Don't duplicate email checks:

```typescript
// ❌ BAD: Check scattered across files
// In AdminGate.tsx
if (user?.email === process.env.NEXT_PUBLIC_ALLOWED_EMAIL) { ... }

// In LoginModal.tsx
if (email === process.env.NEXT_PUBLIC_ALLOWED_EMAIL) { ... }

// ✅ GOOD: Single source of truth
import { isAllowedEmail } from '@/lib/auth/allowed-user';

// In AdminGate.tsx
if (isAllowedEmail(user?.email)) { ... }

// In LoginModal.tsx
if (isAllowedEmail(email)) { ... }
```

**Why it matters:** Centralized logic is easier to audit and update.

---

## 🔄 State Management

### Order Matters: Update Dependent State Before Dependent State

When dispatching multiple actions that have dependencies, dispatch them in the correct order. If Action A resets a value that Action B sets, dispatch A first:

```typescript
// ❌ BAD: Component selection gets immediately cleared
const handleComponentClick = (componentId: string, parentCategoryId: string) => {
  onSelectComponent(componentId); // Sets surveyComponentKey = componentId
  onSelectCategory(parentCategoryId); // Sets surveyCategoryId AND resets surveyComponentKey = null
  // Result: surveyComponentKey is null (lost!)
};

// ✅ GOOD: Update parent state first, then dependent state
const handleComponentClick = (componentId: string, parentCategoryId: string) => {
  // Only update category if it's changing
  if (parentCategoryId !== selectedCategoryId) {
    onSelectCategory(parentCategoryId); // Sets surveyCategoryId first
  }
  onSelectComponent(componentId); // Now sets surveyComponentKey (won't be cleared)
};
```

**Why it matters:** Reducers often reset dependent state when parent state changes. If you dispatch actions in the wrong order, the second dispatch can overwrite the first.

**Pattern to watch for:**

- Reducer case `SET_PARENT` resets `childState = null`
- You dispatch `SET_CHILD(value)` then `SET_PARENT(id)`
- Result: `childState` ends up as `null` instead of `value`

**Solution:** Check if parent needs updating, update it first, then update child.

---

## 🎨 CSS & Styling

### Fixed HUD Chrome Must Outrank Particle Canvases

The landing HUD is instrumentation chrome, not page content. Keep `.hud`
above global particle/fixed canvases, and give 1px rails their own visible
line token instead of relying on a generic low-alpha border token.

```css
.hud {
  z-index: 50;
}

.hud__rail__track {
  background: linear-gradient(
    to bottom,
    transparent,
    var(--hud-rail-line) 8%,
    var(--hud-rail-line) 92%,
    transparent
  );
}
```

**Why it matters:** Transparent WebGL canvases can still sit above the HUD in
the stacking order. Thin rail guides are the first chrome element to look
"deleted" when they sit underneath or paint too faintly.

---

### Polygon Cards: Separate Background from Border

When using `clip-path` for non-rectangular shapes, the border gets clipped too. Use separate layers:

```css
/* ❌ BAD: Border disappears on chamfered edge */
.card {
  clip-path: polygon(0% 20px, 80% 20px, 100% 0%, 100% 100%, 0% 100%);
  border: 1px solid var(--gold-30);
  background: rgba(10, 9, 8, 0.4);
}

/* ✅ GOOD: Background via ::before, border via SVG */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(10, 9, 8, 0.4);
  clip-path: polygon(0% 20px, 80% 20px, 100% 0%, 100% 100%, 0% 100%);
  z-index: 0;
}

/* SVG in markup traces the polygon */
.card__border polygon {
  fill: none;
  stroke: var(--gold-30);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
```

**Why it matters:** CSS `clip-path` clips everything including borders. SVG gives precise stroke control.

---

### Scroll Clipping vs Decorative Clipping

When content scrolls inside a non-rectangular shape, clip content at a **horizontal line**, not the decorative polygon:

```css
/* ❌ BAD: Content follows chamfer (appears in corners when scrolling) */
.content {
  clip-path: polygon(0% 32px, 80% 32px, 100% 0%, 100% 100%, 0% 100%);
}

/* ✅ GOOD: Content clips at horizontal line */
.content {
  clip-path: inset(38px 0 0 0); /* 32px step + 6px safety margin */
}
```

**Why it matters:** Users expect scroll content to disappear at a consistent horizontal edge, not follow decorative angles.

---

### Use CSS Variables for Geometry Tokens

Non-rectangular shapes should define geometry as variables:

```css
/* ✅ GOOD: Single source of truth */
.card {
  --notch-w: 220px; /* where diagonal starts from left */
  --notch-h: 32px; /* how far down the step goes */
}

.card::before {
  clip-path: polygon(
    0% var(--notch-h),
    calc(var(--notch-w) - var(--notch-h)) var(--notch-h),
    var(--notch-w) 0%,
    100% 0%,
    100% 100%,
    0% 100%
  );
}
```

**Why it matters:** Easy to tune, documents intent, keeps SVG and CSS in sync.

---

### Use CSS Variables for Animation Values

Values that might change should be CSS variables:

```css
/* ❌ BAD: Magic numbers */
.element {
  transition: transform 0.3s ease-out;
  opacity: 0.15;
}

/* ✅ GOOD: Named variables */
:root {
  --transition-duration: 0.3s;
  --transition-easing: ease-out;
  --inactive-opacity: 0.15;
}

.element {
  transition: transform var(--transition-duration) var(--transition-easing);
  opacity: var(--inactive-opacity);
}
```

**Why it matters:** Easier to tune, documents intent.

---

### Tensor Gold for Terminal Elements

Terminal/manifesto text uses Tensor Gold with CRT glow:

```css
.terminal-text {
  color: var(--gold, #caa554);
  text-shadow:
    0 0 2px rgba(202, 165, 84, 0.8),
    0 0 4px rgba(202, 165, 84, 0.4),
    0 0 8px rgba(202, 165, 84, 0.2);
}
```

**Why it matters:** Consistent brand color for terminal aesthetic.

---

## ✅ Quick Checklist

### Before Committing Animation Code

- [ ] All animated elements sync to shared timing constants?
- [ ] DOM reads batched in single rAF?
- [ ] State resets when scrolling back?
- [ ] Animation frame cleaned up on unmount?

### Before Committing Canvas Code

- [ ] Wrapped in error boundary?
- [ ] Three.js resources disposed on unmount?
- [ ] requestAnimationFrame loop cancelled?

### Before Committing Auth Code

- [ ] Server validates token, not client state?
- [ ] Using centralized `isAllowedEmail()`?
- [ ] Bearer token passed in API requests?

### Before Committing State Management Code

- [ ] Multiple dispatches ordered correctly (parent before child)?
- [ ] Reducer doesn't reset dependent state unexpectedly?
- [ ] State updates are idempotent (safe to call multiple times)?

### Before Committing CSS

- [ ] Magic numbers extracted to variables?
- [ ] Terminal text uses Tensor Gold?
- [ ] Vendor prefixes for newer properties?
- [ ] Polygon shapes: background and border separated?
- [ ] Scroll clipping uses horizontal line (not decorative polygon)?

---

## 🔁 After a non-trivial fix

When a bugfix changes runtime behavior, **do not** rely on chat history — run the **post-incident capture** steps in [MAINTENANCE.md](MAINTENANCE.md) (Cycle A). If a checkbox triggers, update `sentinel/BEST-PRACTICES.md`, an ADR, a path rule, or a `SKILL.md` **before** the work is considered done.

Trivial changes (typos, copy, formatting-only) skip this; see [MAINTENANCE — When to NOT capture](MAINTENANCE.md#when-to-not-capture).

---

_Last updated: 2026-07-06_
