---
name: Mobile Services Stack
overview: Make the manifesto→services transition feel continuous on mobile by morphing the manifesto frame into a stacked services deck, with a vertical swipe gesture to cycle the 3 service cards. Desktop behavior remains unchanged.
todos:
  - id: context7-motion-swipe-docs
    content: Use Context7 to fetch Framer Motion docs for drag/gestures + AnimatePresence and verify they match our installed `framer-motion` before implementing the swipe deck.
    status: completed
  - id: swipe-services-stack
    content: Update `ServicesStackMobile` to support vertical swipe (up/down) to cycle cards, with reduced-motion fallback.
    status: completed
    dependencies:
      - context7-motion-swipe-docs
  - id: mount-deck-in-bridgeframe
    content: Change `NavigationCockpitV2/index.tsx` so mobile services deck is rendered inside the bridge-frame during the manifesto→services transition (desktop unchanged).
    status: completed
    dependencies:
      - swipe-services-stack
  - id: mobile-bridgeframe-collapse-css
    content: Add/tune mobile CSS so `.bridge-frame` collapses from `manifesto-active` tall terminal to a card-sized deck viewport during services.
    status: completed
    dependencies:
      - mount-deck-in-bridgeframe
  - id: mobile-breakpoint-qa
    content: Manually verify the transition + swipe behavior on common mobile widths (320–768) and confirm desktop remains unchanged.
    status: completed
    dependencies:
      - mobile-bridgeframe-collapse-css
---

# Mobile manifesto → services stacked deck (vertical swipe)

## Goals

- **Mobile (<768px)**: the manifesto frame should smoothly collapse into a **3-card stacked services deck**.
- **Interaction**: **vertical swipe** (up/down) cycles cards (deck-style), with a small indicator and touch-friendly affordances.
- **Desktop**: leave the existing higher-breakpoint behavior untouched.

## Context7 guardrails (best practices)

- **Resolve the library ID first**: Framer Motion has multiple close matches in Context7; don’t hardcode an ID unless it’s been resolved for this environment.
- **Keep docs version-aligned**: sanity-check against `package.json` (notably `framer-motion` and `next`) to avoid API drift.
- **Fetch only what we need**: focus on `drag`/gesture handling, `AnimatePresence` (for card swap/exit), and reduced-motion helpers.
- **Prefer canonical APIs**: then adapt them to existing Thoughtform patterns (scroll-driven progress, no CSS transitions for scroll-bound transforms).

## What’s already there (and why mobile feels disconnected)

- **Desktop is complete**: the manifesto frame becomes the right-most service card and `ServicesDeck` fans out.
- **Mobile currently** renders a separate fixed `ServicesStackMobile` deck (tap-to-cycle) and **does not render services content inside the bridge frame** due to `!isMobile` guards.

Relevant spots:

```1652:1689:components/hud/NavigationCockpitV2/index.tsx
      {/* Services Deck - Three service cards that fan out (desktop only) */}
      {!isMobile && (
        <ServicesDeck
          enabled={manifestoComplete}
          progress={tServicesCards}
          anchorBottom={bridgeFrameStyles.finalBottom}
          anchorLeft={bridgeFrameStyles.left}
          anchorTransform={bridgeFrameStyles.transform}
          cardWidthPx={Number.parseFloat(bridgeFrameStyles.width) || SERVICES_CARD_WIDTH}
          cardHeightPx={Number.parseFloat(bridgeFrameStyles.height) || SERVICES_CARD_HEIGHT}
          sigilConfigs={sigilConfigs}
          isAdmin={isAdmin}
          onEditClick={handleOpenSigilEditor}
          editingCardIndex={editingServiceSigilIndex}
        />
      )}

      {/* Mobile Services Stack - Tap-to-cycle stacked cards */}
      {isMobile && manifestoComplete && (
        <div
          className="mobile-services-container"
          style={{
            position: "fixed",
            bottom: "10vh",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "360px",
            zIndex: 30,
          }}
        >
          <ServicesStackMobile
            progress={tServicesCards}
            sigilConfigs={sigilConfigs}
            isVisible={tServicesCards > 0}
          />
        </div>
      )}
```

```1274:1343:components/hud/NavigationCockpitV2/index.tsx
          {/* Services card content (right-most card) */}
          {!isMobile && tManifestoToServices > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                opacity: tServicesCards,
                pointerEvents: tServicesCards > 0.5 ? "auto" : "none",
                overflow: "hidden",
                willChange: "opacity",
                backfaceVisibility: "hidden",
              }}
            >
              {/* ... Strategies card content ... */}
            </div>
          )}
```

## Proposed mobile approach (matches your request)

- **Keep the bridge-frame as the “morphing container”** (manifesto → services), but once services begins on mobile, it **shrinks to a card-sized area** and becomes the **deck viewport**.
- Replace tap-to-cycle with a **vertical swipe gesture** using **Framer Motion** (already in the repo) for smooth drag + settle.
- Maintain “stacked behind” depth by rendering 3 cards with offsets, but only the front card is draggable.

Why Framer Motion (vs shadcn Carousel): shadcn’s carousel patterns are primarily horizontal/Embla-based; for a **vertical swipe deck** motion + drag handling is more natural, and we already depend on `framer-motion` (no new UI deps).

## Implementation steps

1. **Context7: verify Motion gesture APIs (before coding)**

- Resolve the correct Context7 library ID for Framer Motion, then pull focused docs for `drag`/gestures + `AnimatePresence`.
- Confirm the patterns match our installed versions (per `package.json`) before we wire up the swipe deck.

2. **Upgrade `ServicesStackMobile` to swipe**

- File: [`components/hud/NavigationCockpitV2/ServicesStackMobile.tsx`](components/hud/NavigationCockpitV2/ServicesStackMobile.tsx)
- Replace `onClick`-only behavior with **drag="y"** on the front card.
- On drag end:
  - swipe up → next card
  - swipe down → previous card
  - below threshold → snap back
- Update UI copy from “TAP TO CYCLE” → “SWIPE” (and keep tap as fallback if desired).
- Add **`prefers-reduced-motion`** handling (disable drag animations / reduce motion).

3. **Mount the deck _inside_ the mobile bridge-frame during services**

- File: [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx)
- Introduce a mobile-only state like `isMobileServices = isMobile && manifestoComplete && tManifestoToServices > 0`.
- Instead of rendering the fixed `.mobile-services-container`, render a **services overlay** inside the bridge frame when `isMobileServices`.
- Crossfade:
  - manifesto content wrapper already uses `opacity: 1 - tServicesCards`
  - make services overlay `opacity: tServicesCards` and `pointerEvents` only after it’s visible.

4. **Make the bridge-frame collapse from manifesto size → card-sized deck on mobile**

- File: [`app/styles/navigation.css`](app/styles/navigation.css)
- Add a mobile-only selector (e.g. `.bridge-frame.mobile-services-active`) that:
  - overrides `.bridge-frame.manifesto-active` fixed tall height
  - sets a card-appropriate `height` (e.g. ~420–480px, capped with `vh` and safe-area)
  - keeps `left: 50%` centering
  - ensures `overflow: visible` for “stack peek” (or keep hidden if we only want the deck to show)
- Toggle the class from React (Step 2) to ensure manifesto doesn’t stay 80–85vh once services starts.

5. **Mobile QA across common breakpoints**

- Validate at **320/360/375/390/414/480/768px widths**.
- Confirm:
  - deck swipe feels natural and doesn’t jitter
  - the manifesto frame no longer blocks About/Contact on mobile
  - desktop behavior (>768px) is unchanged

## Files expected to change

- [`components/hud/NavigationCockpitV2/ServicesStackMobile.tsx`](components/hud/NavigationCockpitV2/ServicesStackMobile.tsx)
