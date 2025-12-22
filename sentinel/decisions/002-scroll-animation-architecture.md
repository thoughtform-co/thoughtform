# ADR-002: Scroll Animation Architecture

**Date:** 2024-12  
**Status:** Accepted

---

## Context

The landing page has complex scroll-driven animations:

- Sigil particles moving to navbar
- Wordmark fade and slide
- Module cards appearing/closing
- Terminal frame morphing
- Definition text transitions

Previously, these animations were implemented with:

- Multiple independent `useEffect` hooks listening to scroll events
- Inline calculations scattered throughout `NavigationCockpitV2`
- Multiple `getBoundingClientRect()` calls per frame (layout thrashing)
- Easing functions duplicated across components

This caused:

1. **Layout thrashing** - Multiple DOM reads per scroll event
2. **Inconsistent timing** - Animations out of sync
3. **Hard to maintain** - Transition logic spread across 800+ lines
4. **Difficult to tune** - Constants buried in implementation

---

## Decision

We will centralize scroll animation logic into dedicated hooks:

### 1. `useScrollMetrics` hook

Single source of truth for scroll-related DOM reads, batched into one `requestAnimationFrame`:

```typescript
// lib/hooks/useScrollMetrics.ts
export function useScrollMetrics(refs: RefObject<HTMLElement>[]) {
  // Batches all getBoundingClientRect() calls into single rAF
  // Returns: { scrollY, viewportHeight, elementRects }
}
```

### 2. Transition hooks

Each major transition gets its own hook:

```
components/hud/NavigationCockpitV2/hooks/
├── easing.ts                    # Centralized easing functions
├── useHeroToDefTransition.ts    # Hero → Definition section
├── useDefToManifestoTransition.ts # Definition → Manifesto
├── useManifestoProgress.ts      # Manifesto content reveal
└── useActiveSection.ts          # Section detection via IntersectionObserver
```

### 3. Synchronized timing constants

All transition thresholds defined in one place:

```typescript
// Sigil exit: 0.15 → 0.40
const sigilOutStart = 0.15;
const sigilOutEnd = 0.4;

// Other elements sync to these values
const wordmarkFadeStart = 0.12; // Slightly earlier for smooth lead-in
const moduleCardsCloseStart = 0.15; // Synced with sigil
```

---

## Alternatives Considered

### Alternative 1: GSAP ScrollTrigger

- **Pros:** Battle-tested, declarative, timeline support
- **Cons:** Additional dependency, learning curve, harder to customize particle integration

### Alternative 2: Framer Motion scroll animations

- **Pros:** React-native, good DX
- **Cons:** Less control over particle system integration, heavier bundle

### Alternative 3: Keep inline calculations

- **Pros:** No refactoring needed
- **Cons:** Layout thrashing, inconsistent timing, maintenance burden

---

## Consequences

### Positive

- **Single rAF loop** - All DOM reads batched, no layout thrashing
- **Synchronized animations** - All elements use same scroll progress
- **Tunable constants** - Easy to adjust timing in one place
- **Testable** - Hooks can be unit tested in isolation
- **Self-documenting** - Hook names describe what they do

### Negative

- **More files** - Hook abstraction adds indirection
- **Learning curve** - New developers need to understand hook structure

### Neutral

- Scroll progress calculation moved from Lenis callback to centralized hook

---

## Implementation Files

- `lib/hooks/useScrollMetrics.ts` - Centralized DOM reads
- `components/hud/NavigationCockpitV2/hooks/` - Transition hooks
- `components/hud/NavigationCockpitV2/index.tsx` - Main component using hooks
- `components/hud/SigilSection.tsx` - Sigil with synced exit timing

---

## References

- [Layout Thrashing](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)
- [requestAnimationFrame batching](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
