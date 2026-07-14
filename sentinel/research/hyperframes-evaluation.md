# HyperFrames — evaluation for Thoughtform.co

> Investigation prompted by [@pascowebdesigns' tweet](https://x.com/pascowebdesigns)
> ("HTML isn't just markup anymore. For AI agents, it's becoming the best
> visualization layer.") and the question: _could we use HyperFrames for some of
> our animations?_ Repo: [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes).
> Status: **research note, no adoption.** Date: 2026-07-14.

---

## TL;DR

**HyperFrames is an HTML→MP4 _video renderer_, not a live-animation runtime.** You
write a composition as a plain HTML file with a _paused_ GSAP timeline; it seeks
that timeline frame-by-frame through headless Chrome and encodes the result to
MP4 with FFmpeg. It's a HeyGen open-source project (Apache-2.0, ~35k stars, very
active) built primarily so **AI agents can generate video** from the HTML/CSS
they already speak.

That reframes the original question. HyperFrames **can't power our live site
animations** — those are interactive, scroll-driven WebGL + CSS, and HyperFrames
emits a fixed pre-rendered clip. But it **is a genuinely good fit for producing
branded _video_ assets** (launch / social / OG / explainer clips) authored in
the exact CSS/SVG/GSAP idiom we already use — including the CSS-mask reveal
technique from the tweet's "css mask inspo" shoutout, which our `landing.css`
already leans on heavily.

| Use case | Verdict | Why |
| --- | --- | --- |
| Power our **live site animations** (corridor, brandmark, connectors) | ❌ **No** | They're interactive/real-time 3D; HyperFrames output is a pre-rendered MP4 with no scroll-scrubbing or per-visitor state. |
| Produce **marketing / launch / social / OG video** | ✅ **Yes** | This _is_ its purpose; reuses our visual language; agent-authorable; deterministic in CI. |
| **Low-tier / reduced-motion MP4 fallback** for WebGL scenes | 🟡 **Marginal** | Trades interactivity + fidelity for lower GPU cost; video decode isn't free; only worth it for a specific, measured device tier. |

**Recommendation:** don't wire it into the site. If we want on-brand motion
graphics for marketing, trial it as a _separate authoring tool_ (invoked via
`npx`, kept out of the Next build). See [Next steps](#7-recommendation--next-steps).

---

## 1. What HyperFrames is

- **Tagline:** _"Write HTML. Render video. Built for agents."_ An open-source
  framework that converts HTML, CSS, media, and seekable animations into
  **deterministic MP4 videos**.
- **The render pipeline is literal:** _"the browser is the rendering engine."_
  HyperFrames seeks each frame in **headless Chrome** (Puppeteer), captures it,
  and encodes with **FFmpeg** — same input → same video. Wall-clock JS
  (`setTimeout`/`setInterval`) is forbidden because it isn't seekable.
- **Composition format = a single plain HTML file** (no build step, `index.html`
  plays as-is):
  - A root `#stage` carries `data-composition-id`, `data-width`, `data-height`,
    `data-start`, `data-duration`.
  - Child "clips" carry `data-start`, `data-duration`, `data-track-index`
    (tracks = layers; media via `<video>/<audio>/<img>`).
  - **Animation is a _paused_ GSAP timeline registered on a global:**
    `window.__timelines[compositionId] = tl`. The renderer seeks it per frame.
- **CLI (non-interactive by default, so agents can drive it):**
  ```bash
  npx hyperframes init my-video
  npx hyperframes preview   # opens in a browser
  npx hyperframes render    # → MP4 via headless Chrome + FFmpeg
  npx hyperframes lint      # validates the composition
  ```
- **Agent integration:** ships an MCP server + 20+ skills (`/product-launch-video`,
  `/website-to-video`, `/motion-graphics`, …) and an "Open Design" handoff where a
  design agent emits a first-draft composition and a coding agent refines timing.
- **Requirements / distribution:** Node 22+ and FFmpeg; consumed via `npx`
  (it's a private monorepo publishing `@hyperframes/*` workspace packages, not a
  single umbrella library). **No framework required** — compositions are plain
  HTML; React 19 is used only _internally_ for its Studio/player.
- **License / maturity:** Apache-2.0, no per-render fees; ~35k stars, ~295
  releases, last release (v0.7.56) within a day of this investigation. Pre-1.0
  (v0.7.x), so APIs may still move.

**README composition snippet (verbatim):**

```html
<div id="stage" data-composition-id="launch" data-start="0"
  data-width="1920" data-height="1080">
  <video class="clip" data-start="0" data-duration="6"
    data-track-index="0" src="intro.mp4" muted></video>
  <h1 id="title" class="clip" data-start="1" data-duration="4"
    data-track-index="1">Launch day</h1>
  <audio data-start="0" data-duration="6"
    data-track-index="2" src="music.wav"></audio>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from("#title", { opacity: 0, y: 40, duration: 0.8 }, 1);
    window.__timelines = window.__timelines || {};
    window.__timelines.launch = tl;
  </script>
</div>
```

**Its visual toolkit** (from the block registry): DOM particles (`<div>` + GSAP
staggered bursts, _not_ canvas), CSS `clip-path`/`mask` reveals and lower-thirds,
a `shader-transitions` package of WebGL/GLSL effects (`sdf-iris`,
`gravitational-lens`, `domain-warp-dissolve`, …), plus charts, maps, device
mockups, and liquid-glass UI. The tweet's specific cards (BRYUM field-survey,
macro-optics, mossy particle center) are **not** shipped registry blocks — they
are bespoke demo compositions built with that toolkit.

---

## 2. Our current animation surface (the honest map)

> Aside: `CLAUDE.md`'s "Tech Stack" block is stale — it says Next 14 / React 18.
> Actual `package.json`: **Next `^16.2.6`, React `^19.2.6`, three `^0.170.0`,
> @react-three/fiber `^9.0.0`, drei `^10.0.0`, gsap `^3.14.2`,
> framer-motion `11.15.0`, @studio-freight/lenis, zustand 5.**

| Tech | Role | Representative locations |
| --- | --- | --- |
| **Three.js + R3F + Drei (WebGL)** | The dominant, load-bearing engine. Custom GLSL as TS template literals throughout. | `components/landing/home-v2/DepthGatewayScene/` (the production hero corridor), `components/brand/BrandmarkParticleField/`, `components/landing/v7/intelligence-layer/`, `components/landing/home-v2/services/hologram/` |
| **GSAP (ScrollTrigger)** | Scroll-driven scrubbing for the brandmark + sigil. Not used broadly. | `components/landing/v7/hooks/useBrandmarkJourney.ts`, `.../useSigilEntranceScrub.ts` |
| **CSS keyframes + reveals** | The landing's reveals, parallax, HUD grammar. 26 `@keyframes`; 36 `mask-image`/`clip-path`/`backdrop-filter` uses in `landing.css`. | `components/landing/v7/landing.css`, `hooks/useRevealMotion.ts`, `hooks/useLandingScroll.ts` |
| **Canvas 2D** | Legacy space/terrain background + a mobile seam fallback. | `components/particles/ParticleCanvasV2.tsx`, `components/landing/home-v2/CorridorSeamPixelField.tsx` |
| **Framer Motion** | Peripheral only — modals, a parallax wrapper. Not the landing engine. | `components/auth/LoginModal.tsx`, `components/parallax/ParallaxLayer.tsx` |

**Brandmark system** (ADRs 010→011→013→015→017→019): a single continuous
transform, many painters. `lib/brandmark/journey.ts` is a **pure function**
`computeBrandmarkTransform(scrollY, keyframes, ctx)` whose output (rect, opacity,
density, dispersion, rotationY, morph channels) is written to a zustand store
(`lib/stores/brandmarkJourneyStore.ts`) by an rAF driver
(`hooks/useBrandmarkJourney.ts`); R3F painters subscribe imperatively inside
`useFrame`. The point cloud is rendered by a fixed viewport R3F `<Canvas>`
(`components/brand/BrandmarkParticleField/BrandmarkParticleCanvas.tsx`) with
pixel-space orthographic shaders (`.../shaders.ts`).

**Landing V7**: an authored static HTML prototype
(`public/prototypes/v7/landing-v7-motion.html`) is parsed at build time by
`lib/v7-parse/index.ts` and injected via `dangerouslySetInnerHTML`, then React
decorates it with hooks + portals — so `LandingPage.tsx` must stay render-stable.
**CelestialConnectors** (`components/landing/v7/CelestialConnector/DiagramSvg.tsx`)
are already **pure, config-driven SVG + CSS** (no WebGL).

---

## 3. Fit analysis

### ❌ Live site animations — No

Our magic is _interactive_: scroll drives real-time WebGL (the depth-gateway
corridor fly-through, the brandmark point cloud, the intelligence-layer triad)
plus CSS reveals. HyperFrames produces a **fixed MP4** — there is no live
scroll-scrubbing, no 3D interactivity, no hover/pointer state, no per-visitor
variation. Anything needing true depth/parallax or scroll-coupling is inherently
WebGL and stays that way.

### ✅ Marketing / launch / social / OG video — Yes

This is HyperFrames' actual purpose, and it's a strong fit for us specifically:
we'd author video in the **same CSS/SVG/GSAP language** we already use, reusing
our tokens (`--gold`, `--void`, `--dawn`), our celestial-connector SVG motifs,
and our HUD grammar. Output is deterministic (reproducible in CI) and
agent-authorable end-to-end. Candidate outputs: a launch/announcement clip, a
looping social teaser, an OG/preview video for link unfurls, a short "how it
works" explainer.

### 🟡 Low-tier / reduced-motion MP4 fallback — Marginal

We already tier rendering by device (`useDeviceTier`) and ship non-WebGL
fallbacks (`CorridorSeamPixelField`, the SVG brandmark). In principle a
pre-rendered MP4 loop could replace a WebGL/Canvas path on the lowest tier to cut
GPU cost — but video decode + memory isn't free, the loop loses scroll-coupling
and fidelity, and it adds an asset-management burden. Only worth it if a specific
device tier is measured to be GPU-bound _and_ a looping non-interactive
background is acceptable there. Not a priority.

---

## 4. What we'd reuse vs. import

Very little to import — mostly **validation of patterns we already use**:

- **"Paused timeline seeked by an external driver"** is _already_ our model: the
  brandmark is `computeBrandmarkTransform(scrollY, …)` (pure fn) → store →
  `useFrame`, and the landing is "scroll writes a CSS custom property → CSS reads
  it" (`--depth`, `--practice-progress`, `--brand-silhouette-morph`, …).
  HyperFrames formalizes the same idea for offline rendering.
- **CSS-mask organic reveals** (the tweet's "css mask inspo") are already native
  here: `landing.css` composites `backdrop-filter: blur() saturate()` through a
  `mask-image` gradient for the build-quote dissolve, wipes eyebrows with
  `clip-path: inset(...)`, and edge-fades the rail window with a mask. There's no
  new technique to adopt — only, perhaps, more ambitious use of it.

---

## 5. Environment / adoption notes

- This container has **Node 22.22.2 ✓** and **Chromium ✓** (Playwright,
  `/opt/pw-browsers`), but **FFmpeg is not on `PATH`** (Playwright bundles a
  minimal `ffmpeg-1011` build that may lack the h264 encoder HyperFrames needs).
  A real render would likely need a proper FFmpeg install.
- HyperFrames is a **CLI/monorepo consumed via `npx`**, not a library you
  `import`. If we adopt it, it's a **separate authoring/build tool**, never a
  runtime dependency of the Next app. Do not add `hyperframes` / `@hyperframes/*`
  to the app's `package.json`.
- Compositions should live in a **sibling folder excluded from the Next build**
  (e.g. `video/`), mirroring HeyGen's own
  [`hyperframes-launches`](https://github.com/heygen-com/hyperframes-launches)
  repo pattern.

---

## 6. Constraints if the fallback-video idea is ever pursued

From [ADR-008](../decisions/008-landing-v7-background-layers.md) and the landing
rules — noted only for completeness:

- A new fixed/sticky full-bleed layer must be registered in the ADR-008 paint
  stack and be **opaque** (or documented-transparent), or it un-shields the fixed
  gold radial / hero video beneath it.
- Reveals must fade an **inner child**, never a shielding wrapper.
- `LandingPage.tsx` must stay **render-stable** (innerHTML + nested portals); a
  new visual mounts as a leaf/portal, not by re-rendering the page.

---

## 7. Recommendation & next steps

1. **Don't** integrate HyperFrames into the site runtime — it's the wrong tool
   for interactive scroll-driven animation.
2. **If** we want on-brand motion graphics for marketing, run a small
   proof-of-concept: scaffold one composition that reproduces a Thoughtform motif
   (a rotating celestial-connector diagram, or a brandmark reveal) in
   `video/poc-hyperframes/`, `npx hyperframes preview`, then `render` to MP4.
   Expect the FFmpeg gap above; if the render can't run in a given environment,
   commit the composition HTML + a preview screenshot and document the local
   render command.
3. **Keep** any compositions out of the Next build and off the app's dependency
   list.

_This note is the artifact of the investigation; there is no ADR because no
architectural decision is being committed._
