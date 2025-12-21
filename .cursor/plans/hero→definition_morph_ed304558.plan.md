---
name: Hero→Definition morph
overview: Smooth scroll-linked transition where the hero text frame slides to center (swapping to phonetic + practice text), the wordmark particle-morphs to WordmarkSans, and the embedded gold brandmark becomes the centered particle sigil.
todos:
  - id: transition-progress
    content: Add a single tHeroToDef progress value (0→1 over scrollProgress 0→0.12) with easing in NavigationCockpitV2.
    status: completed
  - id: bridge-frame
    content: Unify hero-text-container + hero-tagline-frame into one bridge frame; interpolate CSS position via inline styles; crossfade hero→definition text.
    status: completed
    dependencies:
      - transition-progress
  - id: wordmark-morph
    content: Wire ParticleWordmarkMorph to tHeroToDef; fade hero Wordmark out, particle morph mid-transition, fade WordmarkSans in at end.
    status: completed
    dependencies:
      - transition-progress
  - id: brandmark-to-sigil
    content: Compute brandmark origin as fixed offset from wordmark container; animate SigilSection from that origin to center; fade embedded gold paths.
    status: completed
    dependencies:
      - transition-progress
  - id: retime-elements
    content: Adjust gateway/arrows fade and module-cards/connector appearance to align with tHeroToDef window.
    status: completed
    dependencies:
      - bridge-frame
      - wordmark-morph
      - brandmark-to-sigil
---

# Hero → Definition scroll morph (simplified)

## Goal

Create a **single smooth transition** as the user scrolls from the Hero section into the Definition section:

| Element | Start (Hero) | End (Definition) |

|---------|--------------|------------------|

| **Text frame** | Bottom-left, contains "AI isn't software…" | Mid-left, contains phonetic + "the practice…" |

| **Wordmark** | `Wordmark` (with embedded gold brandmark) | `WordmarkSans` (no brandmark) |

| **Brandmark / Sigil** | Embedded in wordmark "O" | Centered particle sigil (`ThoughtformSigil`) |

All driven by a single **`tHeroToDef`** progress value (0 → 1).

---

## Implementation

### 1. Transition progress value

In [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx):

```ts
// Fixed thresholds (tune once during dev)
const HERO_END = 0; // transition starts immediately on scroll
const DEF_START = 0.12; // transition completes by 12% of total scroll

const rawT = Math.max(0, Math.min(1, (scrollProgress - HERO_END) / (DEF_START - HERO_END)));
const tHeroToDef = easeInOutCubic(rawT);
```

All other elements key off `tHeroToDef` instead of separate magic thresholds.

---

### 2. Bridge frame (text container)

**Current state:** Two separate containers (`hero-text-container` at bottom-left, `hero-tagline-frame` at mid-left) that hard-fade.

**New approach:**

- Merge into a **single fixed element** with the gold-corner frame styling.
- Interpolate its position via **inline CSS**:

```tsx
const frameTop = lerp(heroFrameTop, defFrameTop, tHeroToDef); // e.g. calc(100vh - 180px) → calc(50% + 30px)
const frameLeft = heroFrameLeft; // stays the same
```

- Inside the frame, crossfade content:
  - Hero text opacity: `1 - tHeroToDef`
  - Definition text (phonetic + practice) opacity: `tHeroToDef`

The **wordmark stays outside** (above the frame), per your instruction.

---

### 3. Wordmark particle morph

Leverage existing [`components/hud/ParticleWordmarkMorph.tsx`](components/hud/ParticleWordmarkMorph.tsx):

| Phase | tHeroToDef | What's visible |

|-------|------------|----------------|

| 0 – 0.1 | 0 → 0.1 | Solid hero `Wordmark` (fading out) |

| 0.1 – 0.9 | 0.1 → 0.9 | `ParticleWordmarkMorph` canvas (particles morphing) |

| 0.9 – 1 | 0.9 → 1 | Solid `WordmarkSans` (fading in) |

We already have `wordmarkRef`; add a `definitionWordmarkRef` to get target bounds. Pass both to the morph component along with a normalized sub-progress.

---

### 4. Brandmark → centered sigil

The gold brandmark is the compass shape inside the "O" of the hero wordmark.

**Origin calculation (simple):**

- The brandmark's center is at approximately **x = 27%, y = 44%** of the wordmark container's width/height (from the SVG viewBox ratios).
- On mount, compute `brandmarkOrigin = { x: wordmarkRect.left + wordmarkRect.width * 0.27, y: wordmarkRect.top + wordmarkRect.height * 0.44 }`.
- Recalculate on resize.

**Animation:**

- Enhance [`components/hud/NavigationCockpitV2/SigilSection.tsx`](components/hud/NavigationCockpitV2/SigilSection.tsx):
  - New props: `originPos: {x, y} | null`, `transitionProgress: number`.
  - Apply a `transform` that interpolates from `translate(originX - centerX, originY - centerY) scale(0.3)` → `translate(0, 0) scale(1)`.
  - The existing `ThoughtformSigil` emergence animation kicks in as particles form.

**Fade embedded brandmark:**

- In the hero `Wordmark` SVG, the gold paths use class `.st0`.
- Set `style={{ '--brandmark-opacity': 1 - tHeroToDef }}` on the wordmark container, and in CSS: `.st0 { opacity: var(--brandmark-opacity, 1); }`.

---

### 5. Re-time supporting elements

| Element | Current trigger | New trigger |

|---------|-----------------|-------------|

| Gateway + runway arrows | `scrollProgress > 0.005` | `tHeroToDef > 0.05` (fade out by 0.3) |

| Module cards + connectors | `scrollProgress > 0.08` | `tHeroToDef > 0.7` (appear as sigil settles) |

---

## End-state handoff (tHeroToDef = 1)

- `ParticleWordmarkMorph` canvas hidden.
- Solid `WordmarkSans` fully visible.
- Bridge frame at definition position with phonetic + practice text.
- Sigil at center, fully formed, stays visible into Definition section.
- Scrolling back up reverses everything smoothly (no "played once" flags).

---

## Files touched

- [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx) — progress calc, bridge frame, refs, orchestration
- [`components/hud/NavigationCockpitV2/styles.ts`](components/hud/NavigationCockpitV2/styles.ts) — frame base styles, `.st0` opacity variable
- [`components/hud/ParticleWordmarkMorph.tsx`](components/hud/ParticleWordmarkMorph.tsx) — accept progress prop, remove internal thresholds
- [`components/hud/NavigationCockpitV2/SigilSection.tsx`](components/hud/NavigationCockpitV2/SigilSection.tsx) — origin transform animation
- [`components/hud/Wordmark.tsx`](components/hud/Wordmark.tsx) — expose `.st0` to CSS variable for fade

---

## Verification

1. Scroll slowly from hero → definition: frame glides, text crossfades, particles morph, sigil emerges from brandmark position.
2. Scroll quickly: same result, no flicker or jump.
3. Scroll back up: everything reverses cleanly.
4. Resize viewport: positions recalculate, no misalignment.
