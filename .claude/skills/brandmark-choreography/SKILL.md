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

# Brandmark choreography (Sigil → Backdrop → Rail → Orbit → Hidden)

The section-02 brandmark is **source-owned** while it is part of the diagram (`.sigil__mark img`). The **`position: fixed`** actor (`tf-brandmark-actor`) exists for travel only: it owns the visible mark from the asking-gap backdrop onward. A change to one trigger often regresses another (hero flash, between-section float, rail position drift, practice snap, actor visible after exit).

**Canonical record:** [ADR-010 v2](../../../sentinel/decisions/010-brandmark-choreography.md)
**Related compositing (layers):** [ADR-008](../../../sentinel/decisions/008-landing-v7-background-layers.md), `landing-v7-compositing` skill.

---

## State machine (one paragraph)

The visible mark moves through: **Native sigil source (section 2) → actor morph to asking-gap backdrop (faint, 640px, 0.08 opacity) → actor morph to continuum rail leftmost stop (48px, opacity 1) → actor scrubs along the rail (`L → M → R`) driven by continuum scroll progress → actor morph to practice orbit (parked at `.approach__orbit__mark`, sticky tracker re-pins each frame) → actor fades to hidden as practice exits.** Each travel leg is a GSAP `ScrollTrigger` timeline; `onUpdate` keeps rects live for moving / sticky targets; `onLeave` / `onLeaveBack` settle dock flags when the user scrolls faster than the scrub can finish; `onRefresh` short-circuits when `scrollY < 4` (hero) so the actor never pins to a downstream target on initial load.

The HUD bottom-left brandmark slot (`#hudBrandmark`) is no longer used as a destination. CSS hides it while `[data-brand-on-rail]` is set on the root.

---

## Pre-merge checklist (regression invariants)

Match each item to [ADR-010 § Seven regression rules (v2)](../../../sentinel/decisions/010-brandmark-choreography.md#seven-regression-rules-load-bearing-invariants--v2):

- [ ] **Section 02 source-owned** — `.sigil__mark img` is visible and owns the diagram mark; `.tf-brandmark-actor` opacity is `0` through hero, entrance, and the section-02 parked/read state.
- [ ] **No actor imitation while parked** — do not pin/re-pin the fixed actor to section-02 during the reading state. That recreates the "sticky element detached from the diagram" bug.
- [ ] **Backdrop trigger** — anchored to **`#asking-gap` `top 50% → top 0%`**, `scrub: 0.4`. `captureBackdropRects()` reads `readSigilRect()` (live unscaled sigil rect) and `readBackdropRect()` (live `.ask__brandmark-anchor` rect). The native sigil opacity goes to `0` only as backdrop progress begins.
- [ ] **Rail entry trigger** — anchored to **`#continuum` `top 60% → top 30%`**, `scrub: 0.4`. Source rect is the live backdrop anchor; destination is `readRailRectAt(0)` (leftmost stop on `.crail__line`). Opacity ramps `0.08 → 1` across the morph.
- [ ] **Rail scrub** — anchored to **`#continuum` `top 30% → bottom 60%`**, `scrub: 0.3`. Actor pinned each frame to `readRailRectAt(railFractionForProgress(p))`; rail rect is read live via `.crail__line.getBoundingClientRect()`. Diamond reticle (`.crail__reticle`) opacity goes to `0` whenever `[data-brand-on-rail="true"]` is on the root.
- [ ] **Practice entry trigger** — anchored to **`#practice` `top 40% → top 0%`**, `scrub: 0.4`. Source rect is `readRailRectAt(1)` (live, every frame); destination is `.approach__orbit__mark.getBoundingClientRect()` (live, every frame — sticky parent).
- [ ] **Practice exit trigger** — anchored to **`#practice` `bottom 25% → bottom -10%`**, `scrub: 0.4`. Actor stays pinned at orbit position while opacity tweens `1 → 0`; `onLeave` calls `hideActor()` to settle.
- [ ] **Hero / refresh** — every `onRefresh` else-branch short-circuits when `scrollY < 4`. No travel timeline pins to a downstream target on initial load.
- [ ] **Live rects** — backdrop, rail, and orbit destinations all use live `getBoundingClientRect()` per relevant frame; no stale `onEnter` captures for moving / sticky targets.
- [ ] **Fast scroll** — every travel timeline has `onLeave` / `onLeaveBack` that finalises the dock or returns to the previous parked state.
- [ ] **HUD slot** — `#hudBrandmark` is hidden by CSS (`[data-brand-on-rail]` rule); the actor never `pinToRect`s the HUD rect.
- [ ] **Run** the Playwright "sample + jump" recipe below in **both directions** and verify the visible path matches: hidden in hero → native sigil in section 02 → backdrop fade-in at asking-gap → small mark on rail at continuum → mark scrubs L→M→R → mark at orbit during practice → faded out after practice exit.

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
//   • At #asking-gap centre:       opacity ≈ 0.08 (backdrop park).
//   • At #continuum top + 100:     opacity 1, X near rail leftmost stop.
//   • At #continuum centre:        opacity 1, X near rail middle stop.
//   • At #continuum bottom:        opacity 1, X near rail rightmost stop.
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
- **Asking-gap (`#asking-gap`)** — the `.ask__brandmark-anchor` is invisible and zero-paint; it exists purely as a measurement target for the actor. Do not give it a background, a border, or any visible content. The lane radial washes (`.ask__wash--violet/--amber/--sage`) belong on `.ask__bleed` (a separate layer) so the anchor's rect stays clean.
- **Continuum rail** — the `.crail__reticle` (ring + cross + diamond) becomes opacity 0 whenever `[data-brand-on-rail="true"]`. Do not delete or restructure it: the rail's keyframe loop is also disabled by the same selector. If you need to change the rail visual, tweak the line / frame / stops, not the reticle.
- **HUD bottom-left slot (`#hudBrandmark`)** — retired as a destination on v7. Do not pin the actor there. The CSS rule `[data-brand-on-rail] .hud__brandmark` keeps it hidden in both `true` and `false` states. Do not reintroduce a `.hud__brandmark.is-visible` class write on the v7 page.
- **Practice orbit (`.approach__orbit__mark`)** — sticky inside `.approach__chamber` (CSS grid, column 1). The orbit's natural rect changes during sticky engagement; always read live before pinning. Re-pin every scroll frame while `data-orbit-docked="true"`.
