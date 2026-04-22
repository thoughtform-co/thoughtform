# V7 Homepage Swap Checklist

**Status: EXECUTED** — The V7 prototype is now the production homepage at `/`.

## Current File Locations (post-restructure)

| Concern                  | Path                                           |
| ------------------------ | ---------------------------------------------- |
| Marketing home (RSC)     | `app/(marketing)/page.tsx`                     |
| V7 parser (server)       | `lib/v7-parse.ts`                              |
| Landing client component | `components/landing/v7/LandingPage.tsx`        |
| Celestial connectors     | `components/landing/v7/CelestialConnector/`    |
| Prototype HTML source    | `public/prototypes/v7/landing-v7-motion.html`  |
| Archive (previous home)  | `app/(internal)/archive/current-home/page.tsx` |
| Archive layout gate      | `app/(internal)/archive/layout.tsx`            |

## Original Changes (historical reference)

1. `app/page.tsx` (now `app/(marketing)/page.tsx`) — Renders V7 content directly via server fetch
2. `app/v7-parse.ts` (now `lib/v7-parse.ts`) — Server-side utility that reads and parses the prototype HTML/CSS at build time
3. `app/V7Runtime.tsx` — Replaced by hooks in `components/landing/v7/hooks/` (useLandingScroll, useRevealMotion, useSigilChoreography)
4. `app/v7/page.tsx` — Removed (redirect no longer needed)
5. `app/archive/current-home/page.tsx` (now under `app/(internal)/`) — Previous NavigationCockpitV2 homepage
6. `app/archive/layout.tsx` (now under `app/(internal)/`) — Auth gate

## Archive Access

The previous homepage is available at `/archive/current-home`, gated behind the `(internal)` route group. In development mode, it is open to all logged-in users. In production, internal routes are blocked by `middleware.ts` (rewritten to 404).

## Content Parity

- [ ] All 8 stations populated with final copy (hero, definition, continuum, practice, services, products, about, contact)
- [ ] Practice section tabs working (Adopt / Encode / Build with receipt case studies)
- [ ] Services section cards rendering with inline SVG sigils
- [ ] Products section cells linking to Astrolabe, Atlas, Sigil, Sybil
- [ ] Contact section with working CTA / mailto
- [ ] Footer with brand + social links

## Visual / Motion

- [ ] HUD chrome operational: corner brackets, nav bar, depth indicator, section ticks, coords, progress bar
- [ ] Scroll-linked telemetry updating (progress %, coordinates, signal, sector name)
- [ ] Smooth-scroll navigation from HUD nav links
- [ ] Motion reveal system working (IntersectionObserver-based `is-in` class)
- [ ] Parallax on selected elements via `data-parallax` / `--py`
- [ ] `prefers-reduced-motion` respected (parallax disabled, decorative animations paused)
- [ ] Gateway visual (SVG grid or future Three.js mount) rendering

## Responsive

- [ ] Mobile (430px): all sections readable, touch targets >= 44px, no horizontal overflow
- [ ] Tablet (768px): layout adapts, nav usable
- [ ] Desktop (1440px): full HUD chrome, proper spacing
- [ ] Safe-area insets respected on iOS

## Performance

- [x] No WebGL / R3F dependency (intentionally lighter than current homepage)
- [ ] Lighthouse performance score >= 90 on mobile
- [ ] No layout shift during scroll transitions
- [x] Fonts loading via font-display: swap, no FOIT

## Technical

- [x] `app/page.tsx` server component (metadata export works)
- [x] No imports from `legacy/` or archived forks
- [x] TypeScript compiles with zero new errors
- [x] ESLint passes
- [x] `/` First Load JS: 91.2 kB (down from 486 kB)

## Rollback

To revert: replace `app/(marketing)/page.tsx` with the archived version at `app/(internal)/archive/current-home/page.tsx`.
