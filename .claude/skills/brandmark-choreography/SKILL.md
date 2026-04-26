---
name: brandmark-choreography
description: >
  Scroll-driven positioning for the v7 brandmark (fixed `BrandmarkActor` + `useSigilChoreography`).
  Prevents regressions where the mark drifts, snaps, appears in the hero on refresh, or mis-docks
  into practice/orbit. Activates on edits to `components/landing/v7/hooks/useSigilChoreography.ts`,
  `components/landing/v7/BrandmarkActor.tsx`, or `components/landing/v7/landing.css` (brandmark / layout).
---

# Brandmark choreography (Sigil → HUD → Orbit)

The brandmark is a **`position: fixed`** actor that must stay visually locked to **sigil, HUD, and orbit** targets while the page uses **ScrollTrigger**, **stickies**, and **scale reveals**. A change to one trigger often regresses another (hero flash, between-section float, practice snap).

**Canonical record:** [ADR-010](../../../sentinel/decisions/010-brandmark-choreography.md)  
**Related compositing (layers):** [ADR-008](../../../sentinel/decisions/008-landing-v7-background-layers.md), `landing-v7-compositing` skill.

---

## State machine (one paragraph)

The page moves the actor through: **Hidden → Entrance (reveal) → Park at sigil (section 2) → Handoff (toward HUD / bottom-left) → Park at HUD → Practice entry → Park at orbit → Practice exit → Park at HUD.** Each leg is a GSAP `ScrollTrigger` timeline; `onUpdate` keeps rects live; **`onLeave` / `onRefresh`** must settle boolean dock flags when the user scrolls faster than the scrub can finish.

---

## Pre-merge checklist (regression invariants)

Match each item to [ADR-010 § Seven regression rules](../../../sentinel/decisions/010-brandmark-choreography.md#seven-regression-rules-load-bearing-invariants):

- [ ] **Live unscaled sigil rect** — no “sticky precomputed” viewport lock that leaves the mark floating between sections; use `readSigilRect()`-style centre/parent math.
- [ ] **Entrance** — actor render **scale stays 1** while the source sigil may scale; no inherited scale wobble on `pinToRect`.
- [ ] **Handoff** — timing matches **`contEl` `top 35% → 5%`**, `scrub: 0.4` (tune only with ADR update).
- [ ] **Hero / refresh** — `practiceUndockFromEntry` or HUD pin **not** called from `onRefresh` at **`scrollY === 0`**.
- [ ] **Practice forward travel** — **live** HUD + orbit `getBoundingClientRect()`; no stale `onEnter` captures for sticky targets.
- [ ] **Fast scroll** — `onLeave` (or equivalent) on practice entry/exit timelines finalises dock state.
- [ ] **Run** the Playwright “sample + jump” recipe below on changed triggers.

End of session: if this fix was non-trivial, run [Cycle A in MAINTENANCE.md](../../../sentinel/MAINTENANCE.md#cycle-a-post-incident-capture-checklist).

---

## Runtime debugging — Playwright sample-and-jump detector

Use the **Visual** test browser or a throwaway `test.describe` on `http://localhost:3003/`. The goal is to catch **jumps** (position delta ≫ scroll delta) and **hero contamination** (actor visible when it should be hidden).

```ts
// Inside page.evaluate: scroll, wait, sample fixed actor center vs last sample.
// Run at: scrollY 0, ~0.5*hero, start of section 2, end section 2, practice bands, etc.
//
// Heuristic: if |Δactor| and |Δscroll| are uncorrelated over small steps, something is re-pinning wrong.

await page.goto("http://localhost:3003/", { waitUntil: "networkidle" });

const sample = () =>
  page.evaluate(() => {
    const el = document.querySelector(".tf-brandmark-actor");
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return {
      found: true,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      opacity: getComputedStyle(el).opacity,
    };
  });

let prev = await sample();
for (const y of [0, 200, 400, 800, 1200, 2000, 3000, 4000, 0]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(120);
  const cur = await sample();
  // eslint-disable-next-line no-console
  console.log({
    scrollY: y,
    cur,
    d: prev.found && cur.found ? Math.hypot(cur.x - prev.x, cur.y - prev.y) : null,
  });
  prev = cur;
}
```

Adjust Y stops to your viewport; **add stops** at the handoff, practice top, and orbit dock. A **sudden** center jump (especially while scroll delta is small) almost always means **stale rect** or **wrong onRefresh** branch.

**Production build:** `npm run build` still runs scroll logic; but reproduce bugs in **`npm run dev`** first for faster iteration.

---

## When you touch CSS too

- Section 2 **must not** “fix” drift by making unrelated wrappers `position: sticky` without an ADR — that has broken horizontal alignment and diagram drift in the past. Prefer **live sigil rect** in JS over layout hacks.
