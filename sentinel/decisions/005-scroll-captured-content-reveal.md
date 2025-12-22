# ADR-005: Scroll-Captured Content Reveal

**Date:** 2024-12  
**Status:** Accepted

---

## Context

The manifesto section needed a unique interaction:

1. User scrolls to terminal frame
2. "But why is AI so different?" question appears
3. Further scrolling reveals manifesto text character-by-character
4. Normal page scrolling resumes only after full reveal

This is different from standard scroll-driven animations because:

- Scroll events are **captured** (don't move the page)
- Content reveals **progressively** based on scroll distance
- Page scrolling **resumes** after content complete

---

## Decision

### 1. Scroll capture hook

Create `useScrollCapture` to intercept wheel events:

```typescript
// components/hud/NavigationCockpitV2/hooks/useScrollCapture.ts
export function useScrollCapture({ isActive, onProgress, onComplete, sensitivity = 0.001 }) {
  useEffect(() => {
    if (!isActive) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Capture scroll

      const delta = e.deltaY * sensitivity;
      const newProgress = Math.max(0, Math.min(1, progress + delta));

      onProgress(newProgress);

      if (newProgress >= 1) {
        onComplete();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isActive, onProgress, onComplete, sensitivity]);
}
```

### 2. Character-by-character reveal

`ManifestoTerminal` reveals content based on progress:

```typescript
// ManifestoTerminal.tsx
const charsToShow = Math.floor(revealProgress * totalChars);
const displayedText = FULL_CONTENT.slice(0, charsToShow);
```

### 3. State machine for scroll phases

```
┌─────────────────┐
│  Normal Scroll  │ (page scrolls normally)
└────────┬────────┘
         │ Enter manifesto section
         ▼
┌─────────────────┐
│ Scroll Captured │ (scroll reveals text, page doesn't move)
└────────┬────────┘
         │ Text fully revealed
         ▼
┌─────────────────┐
│  Normal Scroll  │ (page scrolling resumes)
└─────────────────┘
```

### 4. Integration with Lenis

Lenis smooth scrolling must be paused during capture:

```typescript
// When manifesto is active and not complete
if (manifestoActive && !manifestoComplete) {
  lenis.stop();
} else {
  lenis.start();
}
```

---

## Alternatives Considered

### Alternative 1: CSS scroll-snap

- **Pros:** Native, performant
- **Cons:** Can't do character-by-character reveal, binary snap

### Alternative 2: IntersectionObserver + auto-scroll

- **Pros:** No scroll capture needed
- **Cons:** User loses control, feels automated not interactive

### Alternative 3: Click-to-reveal

- **Pros:** Simple implementation
- **Cons:** Less engaging, breaks scroll-driven theme

---

## Consequences

### Positive

- **Unique interaction** - Memorable, on-brand experience
- **User control** - Scroll speed controls reveal speed
- **Reversible** - Scroll up to "un-reveal" text
- **Typewriter feel** - Matches terminal aesthetic

### Negative

- **Accessibility concern** - Must ensure keyboard navigation works
- **Mobile complexity** - Touch events need separate handling
- **Unexpected behavior** - Users may be confused when scroll doesn't move page

### Neutral

- Requires coordination between multiple components

---

## Implementation Files

- `components/hud/NavigationCockpitV2/hooks/useScrollCapture.ts` - Scroll capture
- `components/hud/NavigationCockpitV2/ManifestoTerminal.tsx` - Progressive reveal
- `components/hud/NavigationCockpitV2/index.tsx` - State coordination
- `lib/hooks/useLenis.ts` - Smooth scroll integration

---

## UX Notes

### Visual feedback

- Blinking cursor indicates "more content coming"
- Cursor disappears when fully revealed
- CRT glow effect reinforces terminal aesthetic

### Escape hatches

- Scroll back up to exit captured state
- Keyboard navigation should still work
- Touch devices use swipe gestures

---

## ASCII Art Title

The manifesto opens with ASCII art "AI ISN'T SOFTWARE." rendered character-by-character:

```
▄▀█ █   █ █▀ █▄░█ ▀ ▀█▀   █▀ █▀█ █▀▀ ▀█▀ █░█░█ ▄▀█ █▀█ █▀▀
█▀█ █   █ ▄█ █░▀█   ░█░   ▄█ █▄█ █▀░ ░█░ ▀▄▀▄▀ █▀█ █▀▄ ██▄.
```

This creates a dramatic opening before the manifesto text appears.
