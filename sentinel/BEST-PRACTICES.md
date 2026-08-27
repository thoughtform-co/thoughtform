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
- [Content Guards](#-content-guards)
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

### rAF-throttled DOM/store writers must re-sync on tab-return

The corridor's scroll writers (`useDepthScroll`, `useCorridorExitScroll`,
`useServicesStageScroll`) and the masthead reveal controller are
rAF-throttled and driven by `scroll` / `resize` — they never re-run on their
own. When the tab is backgrounded, `document.hidden` freezes rAF (and the
demand frameloop), and on return **neither the browser nor Lenis reliably
fires a scroll/resize**. So whatever value the writer last wrote before the
hide is left stale, and because nothing re-runs the writer, it STAYS stale
until the user scrolls.

Shipped symptoms (2026-07-17): after a tab switch, the `#services` masthead
copy faded to 0 (its opacity is `--svc-content-in * (1 − --svc-exit)`, and
`--svc-content-in` held a stale low value) and the brandmark centerpiece
showed a mid-flight **non-wireframe** pose (`paintProgress` / `servicesAmbient`
desynced) — "some elements disappeared / the mark is particles not wireframe
on tab-return."

Rule: any rAF-throttled hook that WRITES DOM vars or store state from the
scroll position must also force a fresh re-sync on `visibilitychange` resume.

```ts
const onVisibility = () => {
  if (!document.hidden) writeFrame(); // re-read the live rect, re-establish state
};
document.addEventListener("visibilitychange", onVisibility);
```

Two gotchas found while fixing it:

- If the writer dedupes with an internal cache (`currentContentIn`, …), reset
  the cache before the forced write — a stale-but-matching cache will skip
  the heal (a plain `write()` thinks the value is already correct).
- If a controller tracks internal state a DOM mutation would normally drive
  (the masthead's armed/done), force the resolved end-state directly on
  resume rather than relying on the observer re-firing.

**Runtime check:** at settled `#services`, set `--svc-content-in` to 0 +
clear the masthead text, dispatch `visibilitychange`, and assert the copy +
opacity return (the `scratchpad` resume-resync repro does exactly this).

**Why it matters:** the hooks that DO handle visibility (`useWorldDomTracker`,
`useLenis`, `useCorridorMount`, the motion-follower's `RESUME_IDLE_GAP` snap)
are the precedent — the corridor DOM/store writers were simply the ones that
had been missed.

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

### Pinning a child does not pin its parent's paint plane

A sticky inner stage can be perfectly stationary while its normal-flow section
background still travels through the viewport. When a transition reads as an
unwanted black pane or parallax sheet, inspect the outer section's computed
`background-color`, `background-image`, padding and stacking before retuning
the child reveal. Hiding, delaying or pinning the child cannot remove paint
owned by its parent.

For a stage that should continue over an existing fixed backdrop, make the
outer station an explicit mode-gated transparent exception, keep the live
backdrop's kill target in lockstep with the next opaque station, and finish all
visible child exits before sticky release. Static/mobile/reduced-motion paths
remain opaque and normal-flow.

**Runtime check:** sample the incoming station while its top is still positive,
inspect the section and sticky-child rects separately, and record computed
background image/color plus `elementsFromPoint`. Then enter, reverse above the
pin, and re-enter: visual children must be hidden on both approaches and the
same scroll progress must reconstruct the same state.

**Why it matters:** a child-only fix can look correct on the first forward pass
while the parent's plane still covers the previous station and a one-shot latch
makes every later pass regress.

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

### A pinned-runway station must release the passive section's explicit height

When a passive one-viewport section (`height: 100svh` "viewport lock") is
upgraded to a pinned stage (a taller sticky runway inside the same station —
the ADR-047/049 grammar), the engaged mode MUST override that height
(`height: auto`, gated on the stage's mode attribute so fallbacks keep the
authored lock). Otherwise the station stays a one-viewport box, the runway
**overflows** it, and every in-flow sibling below sits one-runway-minus-one-
viewport too early. The failure is invisible in the DOM state (all vars/
opacities correct) and devastating on screen: under the exit compositing the
next station is an OPAQUE cover at the **same z-index** as the station, so
DOM order wins — it slides over the pinned beat from mid-hold, eating the
stage content from below, and every rect-keyed envelope on the next station's
top (ambient fade, shield lockstep) fires a viewport early. Found live on
`#continuum` (ADR-049 Update 4 §6): the `landing.css` viewport lock predated
the stage and was never released.

**Runtime check:** drive the pinned beat with Playwright at mid-hold
(progress ≈ 0.5) and assert (a) `station.offsetHeight === runway.offsetHeight`,
(b) the next station's `getBoundingClientRect().top` is still below the
viewport, and (c) `document.elementsFromPoint(...)` over the stage's copy
returns the copy itself first — not a sibling `section`. Computed opacity
alone proves nothing; only the hit-test/pixel truth catches a cover.

**Why it matters:** unit tests pin the clocks, but layout composition bugs
live between stylesheets (the passive section's CSS vs the stage's). One
explicit height silently defeats the whole ADR-030 shield/ambient ordering
contract.

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

## 🧩 Nested-root portals (dangerouslySetInnerHTML)

### A parent re-render can orphan a `createRoot` portal mounted into its innerHTML

`LandingPage` renders the parsed v7 prototype via
`dangerouslySetInnerHTML`, then several portals (`ServicesPortal`,
`BuildCasesPortal`) mount their OWN nested React roots
(`createRoot(slot)`) into placeholder nodes **inside** that markup
(`[data-services-root]`, `[data-build-cases-root]`). Those nested roots
are invisible to the parent's reconciler.

If the parent component **re-renders in a way that re-applies the
innerHTML** (the div re-mounts, or React otherwise replaces its
children), the placeholder nodes are swapped for fresh ones. The nested
root keeps rendering into the now-**detached** original node, so its
content silently vanishes from the page — no error, no warning.

This shipped as "the #services cards disappeared" (2026-07-06): a perf
change added `useAuth()` **directly in LandingPage** to gate a lazy
admin overlay. `useAuth` updates async when the Supabase session
resolves → LandingPage re-rendered → the innerHTML nodes were replaced
→ `ServicesStage` (and the build cases) rendered into orphaned nodes.
LandingPage had never re-rendered before (all state lived in refs and
zustand stores), so the latent fragility had never fired.

**Rule:** the component that owns a `dangerouslySetInnerHTML` body with
nested-root portals mounted into it must stay **render-stable**. Never
subscribe it to context/state that updates after mount (`useAuth`, a
frequently-changing store selector). Push such subscriptions DOWN into
leaf components (see `CelestialEditorGate`) so only the leaf re-renders.

**Tell / debug recipe:** a nested-root portal's content is missing but
the mount effect ran (log it). Check the live placeholder node's
internals: `Object.keys(document.querySelector('[data-services-root]'))
.some(k => k.startsWith('__reactContainer'))` — if **false**, the node
in the document is NOT the one `createRoot` attached to; it was
replaced. Then find what re-renders the innerHTML owner. The component
function may log "rendered" while committing into the detached node —
render-invoked-but-no-DOM with no throw and no Suspense fallback is the
signature.

---

## 🎨 Canvas & Three.js

### Compose responsive 3D scenes in viewport space, then derive world space

Do not preserve a desktop composition with a fixed world-unit camera offset.
At a different aspect ratio the same offset changes where every landmark lands
on screen, so a layout that looks intentional at 16:9 can cover a rail or lose
its subject on a wide editorial frame. Define normalized viewport targets
(for example, the left-quarter and right-two-thirds) in one pure layout module,
derive camera shift/object placement/terrain coverage from the active FOV and
aspect, and make both the R3F camera and DOM mirror consume it.

Historical example: the Arc Cases Terrace (ADR-034, retired by ADR-035)
derived a lateral camera translation and an inset aperture from one
`getTerraceViewportLayout(aspect)` module shared by `FlyingCameraRig`,
`useWorldDomTracker`, and `SubstrateTopography` — the camera offset applied
identically to `position.x` and `lookAt.x` so the R3F camera and the DOM
mirror never disagreed. That reveal was replaced by a fixed DOM overlay with
NO camera channel (ADR-035), so the corridor camera is a pure Z dolly again;
the principle still stands for any future responsive world composition — when
a camera or object placement DOES depend on aspect, put the layout in one pure
module both cameras consume, and test it at every supported desktop aspect
(terrain/frustum coverage included).

**Why it matters:** the visual composition and projected DOM are one contract;
two locally plausible offsets are still a bug if they disagree.

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

**`dynamic(..., { ssr: false })` is NOT a substitute for the boundary.**
Deferring a canvas out of the server render only handles SSR. A **runtime**
throw inside `<Canvas>` — a lost GL context, or `postprocessing`'s
`EffectComposer.addPass` reading `getContextAttributes().alpha` off a null
context — bubbles straight past `ssr: false` to the nearest route error
boundary (`app/error.tsx`) and replaces the **whole page** with the fault
screen. Found 2026-07-26 in `/test/services-card-face-lab`, whose own comment
claimed `ssr: false` meant "the frame still paints if WebGL is unavailable";
it did not. Every canvas needs `CanvasErrorBoundary` regardless of how it is
imported. To test it, force the failure rather than waiting for it:

```ts
const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
gl?.getExtension("WEBGL_lose_context")?.loseContext();
// then assert the surrounding DOM is still mounted
```

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

### Growing a canvas object's footprint invalidates every DOM overlay that dodges it

When a WebGL object gains a second surface — a drawer, a panel, a wing — it
starts covering screen area that DOM overlays were positioned into on the
assumption that the area was empty. Those overlays do not collide-detect; they
were hand-placed, or they filter against the object's **old** rect.

Found 2026-07-26 promoting ADR-050's card drawer. `ServicesDesignationLayer`
already dropped brandmark callouts that would land on the front card's photo
(a callout over a photograph reads as annotating the photograph). The drawer
extends card-local +x into exactly the region the right-hand callouts occupy,
so "AI STRATEGY / the standing read" rendered straight through the drawer's
spec grid — looking for all the world like a texture bleed-through, which is
where the debugging time went.

The fix is never a new suppression mechanism — it is feeding the new rect to
the existing one:

```ts
// Test EVERY published surface of the object, not just its primary rect.
const rects = [frontCard, ...(frontCard.drawer ? [frontCard.drawer] : [])];
const inside = (x: number, y: number) => rects.some((r) => /* … */);
```

**Why it matters:** the symptom mimics a rendering bug (ghost text at partial
alpha over a 3D surface), so it pulls you into shader/opacity/renderOrder
territory when the cause is a DOM layer that simply does not know the object
got bigger. Two checks that separate them fast: grep the ghost string — if it
lives in a DOM data file it was never on the texture at all; and confirm the
"bleed" does not move with the slab under pointer-look.

**Corollary — publish the new rect before you need it.** A second surface
carrying its own yaw and foreshortening is not a linear extension of the
primary rect, so it needs its own projected anchor (`RingCardAnchor.drawer`).
Anything that dodges, hit-tests, or annotates the object reads that anchor.

---

### A positional renderOrder rebase forbids mounting children mid-session

If a loop assigns renderOrder by **index** over `group.children`, then adding a
child later renumbers every slot after it — silently, while the loop is
running. Lazy-loading a texture is fine; gating the child's _existence_ on that
texture is not.

ADR-050's drawer bakes lazily (~18 MB for four faces most visitors never open),
and the obvious shape — `{drawerTextures && <group>…</group>}` — would have
inserted a child into `cardGroup.children` on first open, mid-flight of the
ADR-047 deck's positional rebase. Mount the child with its **flag** and let the
map be null until the bake lands:

```tsx
{
  openDrawer &&
    materials && ( // ← mounts with the flag, stable indices
      <mesh>
        <meshBasicMaterial map={drawerTextures?.[i] ?? null} />
      </mesh>
    );
}
```

Then gate the _behaviour_ on readiness instead, so the unmapped child is never
visible: `const wantOpen = … && drawerTextures !== null`.

**Why it matters:** the failure is invisible until the unrelated feature that
owns the rebase runs (here, scrolling on into `#about`), and it presents as
z-fighting between two different cards — about as far from "we added a lazy
texture" as a bug report can land.

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

### React drops clicks on a props-`disabled` button even after you flip the DOM property

When a controller manages a button's enabled state imperatively (the
render-stable, no-re-render pattern used by HUD chrome like the ADR-046
cartridge dock), do NOT also render `disabled` as a JSX prop:

```tsx
// ❌ BAD: React's synthetic event system reads the FIBER PROPS, not the
// live DOM property. props.disabled stays true forever (the component
// never re-renders), so React silently drops every click — even though
// the DOM button looks and hit-tests enabled, native listeners fire, and
// the event bubbles to document.
<button disabled ref={...} onClick={...} />   // controller later sets el.disabled = false

// ✅ GOOD: keep `disabled` out of React's hands entirely. Seed it in the
// controller effect before the first sync, and flip only the DOM property.
<button ref={...} onClick={...} />            // effect: el.disabled = true, then flips
```

**Why it matters:** React's `getListener` nulls interactive-event handlers
(onClick etc.) on form controls whose **props** say `disabled` — it never
re-reads the DOM. The failure is invisible: hit-testing, native
`addEventListener`, and `props.onClick(...)` called manually all work,
only the delegated synthetic path is dead. Found live on the
since-superseded ADR-046 cartridge dock (2026-07-16) — the lesson stands;
cost a four-probe bisect to localize.

**Corollary:** an `inert` ancestor suppresses even programmatic
`el.click()` in Chrome — when probing chrome that toggles `inert`, confirm
the current inert state before interpreting a dead click.

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

### A broad `font: inherit` reset can silently defeat component type rules

`font` is a shorthand, and a selector such as `.instrument button` is more
specific than a component class such as `.instrument__tier`. Setting
`font: inherit` on the broad selector therefore resets the tier's authored
size and line-height back to the parent even when the component rule appears
later. In a clipped control this presents as mysterious ellipsis and vertical
overflow, not as an obvious cascade bug.

In a scoped button reset, inherit only the property the surface actually
needs—usually `font-family`—and let each control own its size, weight, and
line-height. When a compact label clips despite having enough measured width,
inspect the computed font shorthand and selector specificity before changing
the layout.

**Why it matters:** the Intelligence Map's 8.5px allocation labels computed at
16px because `.fl-intel-map button { font: inherit; }` outranked the tier
class. Expanding anchors hid the symptom at large viewports but could not fix
the compact surface; narrowing the reset did.

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

## 📐 Content Guards

### Pin AGREEMENT between surfaces, not the literal value

A published figure repeated on several surfaces drifts one surface at a time.
The instinct is to pin the number in a test (`expect(stat.value).toBe("47+")`),
which fails the moment the number legitimately changes — so the next person
edits the test to match the code, and the guard has taught them to disable it.

Pin the INVARIANT instead: collect every place the claim appears and assert
they reduce to one value.

```ts
// Every stat / readout / block labelled "Skills", plus the sum of the
// map plate's per-shape counts, must agree. No literal appears here.
expect([...totals.keys()]).toHaveLength(1);
```

Raising the count then stays a pure content edit, and forgetting one of six
printings is a red test with a message naming exactly which surfaces disagree
(`tests/lib/cases-registry.test.ts`, ADR-056 U12 — 42 outlived its own source
across six printings before this existed).

Two corollaries learned the same day:

- **A guard only covers what it walks.** The casefile scanner walked `CASES`
  and `PROJECT_CASES`; the same claim on an unlisted `/arcs` deck page shipped
  green for months. When a claim spans content modules, the pin belongs in
  each module's own registry test.
- **Pin the string the copy actually contains.** "22 teams mapped" reads as one
  phrase but lives as a value (`"22"`) and a label (`"teams mapped"`) in
  separate fields — a regex for the joined phrase can never match. Pin the
  half that carries the meaning.

### A clipping parent measures 0 while its child overflows

`scrollHeight - clientHeight` on an `overflow: hidden` box reports its own
overflow, not its descendants'. An inner grid that exceeds its track is
clipped by the parent and the parent measures clean, so an overflow guard
pointed at the outer box passes while content is being cut.

This shipped twice on the same surface. A skills lattice sat 46px over its
stage at 1440×800 and 121px at 2017×1269 with `.fl-plate` reporting 0 both
times, because the plate's own `overflow: hidden` swallowed the grid's
overflow (ADR-056 U15–U16).

**Measure every box that owns a layout, not just the outermost one.** When a
component gains an inner grid or a new view, that box joins the measured set
in the same commit.

### A guard that only sees the default state is not a guard

A surface with an axis toggle, a view tab, or a mode gets tested in whatever
state it mounts in — and the default is reliably the state that fits, because
it is the one that was designed first and looked at most.

The same casefile plate passed its clip guard through a lattice axis that
overflowed by 46px and, one update later, two whole views that had never been
measured. Both were found by capture, not by the suite.

**Iterate the states in the test.** Walk every view × every axis and assert on
each; the loop costs a few seconds and is the only thing standing between a
non-default state and a silent regression.

### Two more that only a capture will catch

Neither has a cheap automated form, so they belong on the eyeball pass:

- **A legend swatch with no fill rule decodes nothing.** Fill rules scoped to
  the marks (`.thing[data-fill]`) leave the legend's swatches as empty boxes.
  Shipped twice on one surface — once keyed on `data-fill`, once on
  `data-kind`. Look at the legend, not just the chart.
- **A budget looser than the box ships silent truncation.** A 24-character
  ceiling on a field whose column holds 20 passes every test and truncates on
  screen. When a guard and a box disagree, the box is right — tighten the
  guard to the measured ceiling, and buy the characters back with tracking
  rather than size.

### A pass-through must not invent a default the callee already supplies

A destructuring default fires on `undefined` **only**. So a wrapper that
forwards an option and gives it a default of its own does not "fall back" to
the callee's — it overrides it, on every call, with a value nobody chose.

`substrateForms`' `validation` painter takes a lattice `p` and steps its grid
loops by it (`for (let x = p; x < w; x += p)`), defaulting to 14. The substrate
lab's `Field` wrapper documented the same option as "the field's own inset" —
the wrong concept, a pitch is not an inset — and defaulted it to **0**, then
forwarded it explicitly. `x += 0` never terminates.

Three things made it expensive to find, and each generalises:

- **It hung during render, so React never committed.** There is no drawing on
  screen to say what happened and no error — the page is simply blank and
  unresponsive, which reads as a dead server rather than a component fault.
- **The state was in the URL.** The lab writes `?v=<variant>` on selection, so
  a refresh re-entered the same hang. "Reloading doesn't help, I have to
  restart the dev server" is what a caller reports, and it points away from the
  component.
- **Only 4 of 33 variants were affected**, because the rest passed an explicit
  pitch. A caller-by-caller difference in one forwarded option is invisible in
  review.

**Two fixes, and take both.** Give the pass-through no default so the callee's
own applies, and clamp at the point where a number becomes a loop step
(`const g = p > 0 ? p : 14`) so no future caller can re-arm it. A value that
controls iteration is not an ordinary option — validate it where it is used,
not where it is passed.

### A pure-arithmetic guard cannot tell you the drawing never mounted

`substrate-lab-fit` was 217 green tests the whole time four of its drawings
could not render. It walks each variant's declared `lettering()` — measures,
word widths, type floor, envelope — and never mounts a component, which is
exactly what makes it fast and exactly what it cannot see.

The renderer-level gate existed too, and it also missed them: the capture
script's default variant list was the seven from **round one**, so twenty-odd
later directions were only ever gated when someone passed `--v` by hand.

**A declaration guard and a render gate answer different questions, and a stale
default list silently narrows the second one.** When a registry grows, the
harness that walks it should default to the registry rather than to a list
written when it was shorter.

### A guard measures a wall, and a curve has more than one radius

Reading 03's carrier drew every ring as a twelve-sided polygon and hung every
label on a **circle**. A regular polygon's distance to its own edge is not one
number — it runs from the apothem `κ·R` at each edge midpoint to `R` at each
vertex, and at that plate's rim `κ` cost **13.1 units**. So the wall swung
inward under labels that did not follow, and **19 of 47 printed through their
own cell edge**.

Every guard passed. The arithmetic one measured `cell.r0` / `cell.r1` — the
partition's nominal radii, which are the wall _only at the twelve vertices_ —
and reported 7 to 12 units of air on both sides of all nineteen. The live one
walked every PAIR of labels for collisions, which is a different question and
was correctly answering it.

Three things generalise:

- **A nominal radius is a model of the wall, not the wall.** Whenever a shape's
  boundary is a function of angle — a polygon, a rounded rect, anything cut by
  a `clip-path` — a guard that samples one radius is asserting the best case.
  Sample the boundary across the span the content actually occupies.
- **The direction of the error tells you where to look.** All nineteen failed
  on the same side, which is the signature of a systematic offset rather than
  of tuning. A per-object test never sees it; the defect lives in the
  RELATIONSHIP between two constructions, which is ADR-069 U1's finding in a
  new place.
- **"Do two labels overlap" and "is a label inside its own box" are different
  questions, and having one is not having the other.** The fix pairs them: the
  arithmetic guard samples the drawn wall, and the live guard probes the ink's
  own extremes with `isPointInFill` on the very path the shape is drawn from —
  which cannot be satisfied by a model that has drifted from the render.

⚠ **And calibrate a containment probe, don't just watch it go green.** Walk a
synthetic displacement until it fires and check the threshold matches the
clearance you measured — a probe with a dead zone, or one whose ink extents are
the wrong way round, is green for the wrong reason. This one reported twelve
false spills on its first run because the ink block is asymmetric about the
baseline (ascender 0.769em above, descender 0.231em below) and the two were
swapped.

### An unfilled SVG shape is only clickable on its stroke

`pointer-events` defaults to `visiblePainted`, and for the INTERIOR of a shape
that means the pointer only hits it when `fill` has an actual value other than
`none`. So an outline-only glyph — a hollow card, an open state, a "not
configured" variant — swallows nothing: a click in the middle of it passes
through to whatever is behind, usually the bare `<svg>`.

Measured on the map console (ADR-069): the three PERSON-LED cartridges are
`fill: none` by design — the record, not an omission — and all three could not
be opened by clicking where a reader clicks, the middle of the card. It shipped
and survived because the **keyboard path was unaffected** (`Enter` on a focused
node worked) and the smoke clicked the FIRST cartridge, which is filled.

Two things follow:

- **Give an interactive group its own hit rect**, sized to the shape's extremes,
  `fill="transparent"`. Matching the extremes matters when anything measures the
  group's `getBBox` — a larger rect moves the box, and with it a `fill-box`
  transform origin.
- **Hit-test every instance, not one.** `document.elementFromPoint` at each
  element's own centre, asserting the element (or a descendant) is what comes
  back, is a two-line loop and the only check that sees this. A state-based
  assertion on one representative instance cannot: the representative is
  reliably the filled one.

### You cannot animate an element React just replaced

Any "the same objects rearrange" motion — FLIP, shared-element, morph — needs
the same DOM nodes on both sides of the state change. Nesting the animated
items inside per-group containers guarantees the opposite: change the
grouping and React unmounts the containers with everything in them, so the
"morph" is really a mount, and it either snaps or crossfades.

Keep the animated items as **flat children of one stable parent, keyed by
identity, in a constant order**, and let layout (grid placement, transforms)
do the grouping. Two corollaries learned with it (ADR-056 U17):

- **Child order is part of the contract.** If chrome interleaves with the
  animated items and the chrome changes per state, React reorders real nodes
  to satisfy it — and `insertBefore` on a connected element cancels its
  running transition.
- **End on `none`, not on a stored matrix.** Animate the inverted transform
  back to nothing, so the rest state is pure layout. Then zero-at-rest is
  structural rather than a value you have to keep correct, and a resize
  mid-flight still lands right.

### `min-height: 0` is what makes a flex child actually shrink

A `-webkit-line-clamp` (or any `overflow: hidden`) on a flex item is advisory
until the item can shrink below its content size. Flex items default to
`min-height: auto`, so the clamp renders, the item refuses to shrink, and the
copy runs straight over whatever sits below it inside a fixed-height parent.
The same applies to `min-width: 0` in a row.

If a clamp "isn't working", check the min-size before touching the line count.

### Reserve geometry for persistent in-panel detail

If selecting an item reveals detail inside a dense instrument, give that detail
an explicit region in the base layout. Do not float it over the field, and do
not let the selected state change the instrument's height. A non-scrolling box
can still be broken when its children are clipped, so verification must compare
the important children's rendered bounds or `scrollHeight` as well as the
console's own dimensions.

Keep compact and expanded disclosure separate: the reserved console carries
the readable states and decisions needed in context; explanatory prose belongs
in the focus overlay. On mobile, override the same compound selectors used by
desktop before assuming that `overflow: visible` or a one-column grid won the
cascade.

**Why it matters:** a field can pass overlap and scrollbar checks while hiding
half of its required content. Reserving space prevents layout jumps; measuring
the content prevents silent truncation.

### Replaced media must surrender its intrinsic grid size

`height: 100%` does not guarantee that an image or video fits a fixed grid
seat. Replaced elements carry an intrinsic minimum; inside a short phone grid,
the box can remain hundreds of pixels taller than its wrapper and paint across
controls while the wrapper itself reports the expected height. Set
`min-height: 0` and a bounded `max-height` on the media, then compare the
rendered media and slot bounds—not only the parent dimensions.

**Why it matters:** the mask can make the spill look plausible while hit
targets and reading order are already compromised.

### Critical phone geometry cannot wait for a runtime mode attribute

If six 44px controls only fit after a scroll hook publishes `data-mode`, the
first hydrated frame is already broken. Put essential phone padding, width and
target geometry behind a CSS media query or server-known class. Runtime
attributes may enhance choreography; they may not establish basic fit.

**Why it matters:** hooks can settle hundreds of milliseconds after mount, so
a layout that looks correct in a settled screenshot can still jump or ship
undersized targets on first paint.

### Inline instrument scrollers release at their bounds

A bounded mobile evidence seat is part of the page, not a modal. Avoid
`overscroll-behavior: contain` unless a reproduced platform bug requires it.
Let the inner surface scroll while it has range, then release the gesture to
the page at either end. Verify this with a real wheel/touch boundary probe.

**Why it matters:** a visually elegant fixed seat becomes a scroll trap when
the reader cannot leave it without starting a new gesture elsewhere.

### Wait for the thing to exist before you measure it

A harness that queries too early doesn't error, it measures nothing — and
then reports that as a finding. An assertion counting stamped elements read
`0 of 47` and blamed the feature for a remount that never happened, because
the stamp ran before the component mounted.

Two habits close it: `waitForSelector` (or await the component's own settle
signal) before the first read, and assert the setup took — if you stamp N
elements, assert N > 0 immediately, so a red test names the harness rather
than the code.

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

_Last updated: 2026-08-27_
