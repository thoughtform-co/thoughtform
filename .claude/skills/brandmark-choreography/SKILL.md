---
name: brandmark-choreography
description: >
  Scroll-driven positioning for the v7 brandmark (fixed `BrandmarkActor` + `useSigilChoreography`).
  Prevents regressions where the mark drifts, snaps, appears in the hero on refresh, mis-docks
  into the orbit, or fails to fade out after practice exit. Activates on edits to
  `components/landing/v7/hooks/useSigilChoreography.ts`, `components/landing/v7/BrandmarkActor.tsx`,
  `components/landing/v7/landing.css` (brandmark / layout / asking-gap / continuum / practice),
  or any change touching the asking-gap section, the continuum rail, the diamond reticle, or the
  practice orbit pin.
---

# Brandmark choreography (Sigil → Miss → Backdrop → Rail → Orbit → Hidden)

The v7 brandmark journey is a five-station scroll state machine.

**What paints the mark depends on the runtime mode:**

- **Particle mode** (ADR-011, default when WebGL is available and
  `prefers-reduced-motion: reduce` is not set): one shared R3F canvas
  paints the mark from a deterministic point cloud sampled from
  `BRANDMARK_FILLED_PATHS`. Every parked station, every transit, the
  asking-gap backdrop, and the post-orbit fade-out are painted by
  particles. The native SVG dock glyphs and the fixed
  `.tf-brandmark-actor` are hidden via the `[data-brandmark-mode="particle"]`
  and `[data-brand-particle-backdrop="true"]` CSS gates. For everything
  _particle-engine_ related see the [`brandmark-particle`](../brandmark-particle/SKILL.md) skill.
- **SVG mode** (fallback for reduced motion or no WebGL): the architecture
  documented in ADR-010 v3 paints the mark — three native source-owned
  park stations (`.sigil__mark img`, `.miss__brand-slot img`,
  `.crail__brand img`) plus the fixed actor for transit / backdrop /
  orbit. **This file documents the state machine and the SVG mode
  invariants.** They must keep holding even though particles are the
  default painter, because the hook still runs the state machine in
  both modes.

The fixed actor (`tf-brandmark-actor`) exists for travel only — five
morphs total: sigil → miss, miss → backdrop, backdrop → rail-entry, rail
→ orbit, orbit → hidden. A change to one trigger often regresses another
(hero flash, between-section float, rail position drift, practice snap,
actor visible after exit).

**Canonical records:** [ADR-010 v3](../../../sentinel/decisions/010-brandmark-choreography.md) (state machine + SVG painters), [ADR-011](../../../sentinel/decisions/011-brandmark-particle-artifact.md) (particle painters).
**Related particle-engine skill:** [`brandmark-particle`](../brandmark-particle/SKILL.md).
**Related compositing (layers):** [ADR-008](../../../sentinel/decisions/008-landing-v7-background-layers.md), `landing-v7-compositing` skill.

---

## State machine (one paragraph)

The journey traverses five stations along scrollY: **sigil → miss →
backdrop → rail → orbit → hidden.** `useSigilChoreography` runs a single
rAF-throttled scroll handler that computes the brandmark's state purely
from `scrollY` and live anchor rects each frame — no per-leg GSAP
timelines, no scroll-trigger settlers. Each segment between two adjacent
stations has a park zone (`PARK_FRAC = 0.32` on each end) and a transit
zone in the middle. **In particle mode** the hook writes a per-frame
`StationSnapshot` into `useBrandmarkParticleStore` (for the parked station
at parked moments, for the destination station with interpolated rect +
density + dispersion during transit, and for the orbit station during
post-orbit fade-out); the shared R3F canvas projects the snapshot's
particles into the right rect with the right density / dispersion / tint.
**In SVG mode** the hook calls `actor.pinToRect` with the same rects and
opacity (sigil and rail use the native sigil / rail glyphs as the painter
during parked moments via the `data-brand-on-*` CSS gates from ADR-010
v3).

The hero guard short-circuits the journey when `scrollY < 4` so the
brandmark is never pinned to a downstream target on initial load (or
refresh-with-restored-scroll). The HUD bottom-left brandmark slot
(`#hudBrandmark`) is no longer used as a destination. CSS hides it while
`[data-brand-on-rail]` is set on the root.

---

## Pre-merge checklist (regression invariants)

Match each item to [ADR-010 § Eight regression rules (v3)](../../../sentinel/decisions/010-brandmark-choreography.md#eight-regression-rules-load-bearing-invariants--v3):

- [ ] **Section 02 source-owned** — `.sigil__mark img` is visible and owns the diagram mark; `.tf-brandmark-actor` opacity is `0` through hero, entrance, and the section-02 parked/read state.
- [ ] **Three source-owned park stations** — `.sigil__mark img`, `.miss__brand-slot img`, `.crail__brand img` each own the visible mark while the choreography is parked there. The fixed actor stays positioned at the brand's rect (so it can re-emerge instantly for the next morph) but is hidden via CSS opacity.
- [ ] **Miss trigger** — anchored to **`#missing-layer` `top 50% → top 0%`**, `scrub: 0.4`. `captureMissRects()` reads `readSigilRect()` (live unscaled sigil rect) and `readMissBrandRect()` (live `.miss__brand-slot img` rect). At p=1, hands to `pinAtMissLayerParked()` → `[data-brand-on-missing="parked"]`.
- [ ] **Backdrop trigger** — anchored to **`#asking-gap` `top 50% → top 0%`**, `scrub: 0.4`. `captureBackdropRects()` reads `readMissBrandRect()` as source (the previous park station) and `readBackdropRect()` as destination. Source rect re-read live each frame inside `applyBackdropMorph` so the brand's scroll position stays accurate.
- [ ] **Rail entry trigger** — anchored to **`#continuum` `top 60% → top 30%`**, `scrub: 0.4`. Source rect is the live backdrop anchor; destination is `readRailBrandRect()` (centre `.crail__brand` slot). Opacity ramps `0.08 → 1` across the morph.
- [ ] **Practice entry trigger** — anchored to **`#practice` `top 60% → top 0%`**, `scrub: 0.4`. Source rect is `readRailBrandRect()` (live, every frame — scrolls with rail DOM); destination is `.approach__orbit__mark.getBoundingClientRect()` (live, every frame — sticky parent).
- [ ] **Practice exit trigger** — anchored to **`#practice` `bottom 25% → bottom -10%`**, `scrub: 0.4`. Actor stays pinned at orbit position while opacity tweens `1 → 0`; `onLeave` calls `hideActor()` to settle.
- [ ] **Hero / refresh** — every `onRefresh` else-branch short-circuits when `scrollY < 4`. No travel timeline pins to a downstream target on initial load.
- [ ] **Live rects** — backdrop, miss-brand, rail-brand, and orbit destinations all use live `getBoundingClientRect()` per relevant frame; no stale `onEnter` captures for moving / sticky targets.
- [ ] **Fast scroll** — every travel timeline (`missTl`, `backdropTl`, `railEntryTl`, `practiceEntryTl`, `practiceExitTl`) has `onLeave` / `onLeaveBack` that finalises the dock or returns to the previous parked state.
- [ ] **Tri-state attrs on documentElement** — `data-brand-on-missing` and `data-brand-on-rail` are written to BOTH the LandingPage rootRef AND `document.documentElement`. The fixed `.tf-brandmark-actor` renders as a sibling of rootRef, so descendant selectors only reach it via `documentElement`.
- [ ] **HUD slot** — `#hudBrandmark` is hidden by CSS (`[data-brand-on-rail]` rule); the actor never `pinToRect`s the HUD rect.
- [ ] **Run** the Playwright "sample + jump" recipe below in **both directions** and verify the visible path matches: hidden in hero → native sigil in section 02 → native miss brand at missing-layer → backdrop fade-in at asking-gap → native rail brand at continuum → mark at orbit during practice → faded out after practice exit.

End of session: if this fix was non-trivial, run [Cycle A in MAINTENANCE.md](../../../sentinel/MAINTENANCE.md#cycle-a-post-incident-capture-checklist).

---

## Runtime debugging — Playwright sample-and-jump detector

Use the **Visual** test browser or a throwaway `test.describe` on `http://localhost:3003/`. The goal is to catch **jumps** (position delta ≫ scroll delta), **hero contamination** (actor visible when it should be hidden), and **bad opacity** at each station.

```ts
// Sample the fixed actor at known scroll positions across the v2 stations.
// Use the section element's offsetTop to compute scroll positions; viewport
// height varies but the station entry/exit triggers are viewport-relative,
// so the centre of each station is a reliable sample target.
//
// Heuristics:
//   • At scrollY = 0 (hero):       actor opacity should be 0.
//   • At #definition top - 100:    opacity 0 (still source-owned).
//   • At #definition bottom:       opacity 0 (parked at sigil source).
//   • At #missing-layer centre:    opacity 0 + data-brand-on-missing="parked"
//                                  (native .miss__brand-slot img owns the mark).
//   • At #asking-gap centre:       opacity ≈ 0.08 (backdrop park).
//   • At #continuum centre:        opacity 0 + data-brand-on-rail="parked"
//                                  (native .crail__brand img owns the mark).
//   • At #practice top + 200:      opacity 1, position == orbit centre.
//   • At #practice bottom + 100:   opacity 0 (faded after exit).

await page.goto("http://localhost:3003/", { waitUntil: "networkidle" });

const sample = () =>
  page.evaluate(() => {
    const el = document.querySelector(".tf-brandmark-actor");
    const root = document.documentElement;
    const approach = document.querySelector(".approach");
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return {
      found: true,
      x: Math.round(r.left + r.width / 2),
      y: Math.round(r.top + r.height / 2),
      w: Math.round(r.width),
      h: Math.round(r.height),
      opacity: parseFloat(getComputedStyle(el).opacity),
      brandOnRail: document
        .querySelector("[data-brand-on-rail]")
        ?.getAttribute("data-brand-on-rail"),
      orbitDocked: approach?.getAttribute("data-orbit-docked"),
    };
  });

const sectionTop = (id: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    return el ? el.offsetTop : 0;
  }, `#${id}`);

const stops = [
  { label: "hero", y: 0 },
  { label: "def-top", y: (await sectionTop("definition")) - 100 },
  { label: "def-mid", y: (await sectionTop("definition")) + 200 },
  { label: "miss-mid", y: (await sectionTop("missing-layer")) + 300 },
  { label: "ask-mid", y: (await sectionTop("asking-gap")) + 200 },
  { label: "cont-top", y: (await sectionTop("continuum")) + 100 },
  { label: "cont-mid", y: (await sectionTop("continuum")) + 400 },
  { label: "cont-bot", y: (await sectionTop("continuum")) + 700 },
  { label: "prac-top", y: (await sectionTop("practice")) + 200 },
  { label: "prac-mid", y: (await sectionTop("practice")) + 1200 },
  { label: "prac-bot", y: (await sectionTop("practice")) + 3000 },
  { label: "post-exit", y: (await sectionTop("build")) + 100 },
];

let prev = await sample();
for (const stop of stops) {
  await page.evaluate((yy) => window.scrollTo(0, yy), stop.y);
  await page.waitForTimeout(180);
  const cur = await sample();
  // eslint-disable-next-line no-console
  console.log(stop.label, { scrollY: stop.y, ...cur });
  prev = cur;
}
```

A **sudden** centre jump (especially while scroll delta is small) almost always means **stale rect** or **wrong onRefresh** branch. **Wrong opacity** at a stop usually means a missed `pinToRect(rect, opacity, scale)` with the right opacity argument (backdrop = 0.08, rail / orbit = 1).

**Production build:** `npm run build` still runs scroll logic; but reproduce bugs in **`npm run dev`** first for faster iteration.

---

## When you touch CSS too

- Section 2 **must not** "fix" drift by making unrelated wrappers `position: sticky` without an ADR — that has broken horizontal alignment and diagram drift in the past.
- Section 2 **must not** be represented by a fixed overlay actor during the reading state. The native `.sigil__mark img` belongs to the diagram; the fixed actor is for travel between stations only.
- **Missing-layer (`#missing-layer`)** — the `.miss__brand-slot img` is the source-owned brandmark for the centre dock. It lives inside the 4-card grid as the centre cell of a 3-column / 2-row CSS grid (`grid-column: 2; grid-row: 1 / span 2`), so it scrolls naturally with the cards and never jiggles. Do not move it outside the grid. The fixed actor only takes over for the travel legs in (sigil → miss) and out (miss → backdrop).
- **Asking-gap (`#asking-gap`)** — the `.ask__brandmark-anchor` is invisible and zero-paint; it exists purely as a measurement target for the actor. Do not give it a background, a border, or any visible content. The lane radial washes (`.ask__wash--violet/--amber/--sage`) belong on `.ask__bleed` (a separate layer) so the anchor's rect stays clean.
- **Continuum rail** — the `.crail__reticle` (ring + cross + diamond) becomes opacity 0 whenever `[data-brand-on-rail="true"]` or `"parked"`. Do not delete or restructure it: the rail's keyframe loop is also disabled by the same selector. If you need to change the rail visual, tweak the line / frame / stops, not the reticle.
- **HUD bottom-left slot (`#hudBrandmark`)** — retired as a destination on v7. Do not pin the actor there. The CSS rule `[data-brand-on-rail] .hud__brandmark` keeps it hidden in both `true` and `false` states. Do not reintroduce a `.hud__brandmark.is-visible` class write on the v7 page.
- **Practice orbit (`.approach__orbit__mark`)** — sticky inside `.approach__chamber` (CSS grid, column 1). The orbit's natural rect changes during sticky engagement; always read live before pinning. Re-pin every scroll frame while `data-orbit-docked="true"`.
- **Substrate dock (`.ilayer__brandmark-anchor`, ADR-012 v2)** — the anchor now lives inside `.ilayer__stack__dock` (a positioned grid cell on top of the R3F canvas), not inside the old `.ilayer__substrate` 3-column frame. The choreography contract is unchanged: `useSigilChoreography.ts` still resolves it via `intelligenceEl.querySelector(".ilayer__brandmark-anchor")` and parks the actor at its rect at full density via the substrate station. Do not move the anchor outside `#intelligence-layer`. The encode disc's inner radius is sized so the brandmark sits cleanly inside the ring's hole — the disc reads as a luminous halo around the canonical SVG glyph. The R3F canvas paints behind / around the anchor, never on top.
