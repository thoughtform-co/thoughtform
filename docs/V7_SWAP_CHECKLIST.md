# V7 Homepage Swap Checklist

**Status: EXECUTED** — The V7 prototype is now the production homepage at `/`.

## What Changed

1. `app/page.tsx` — Now renders V7 content directly (server-rendered HTML from the prototype, scoped CSS, client runtime enhancer)
2. `app/v7-parse.ts` — Server-side utility that reads and parses the prototype HTML/CSS at build time
3. `app/V7Runtime.tsx` — Client-side enhancer for scroll, parallax, reveal, and tab behaviors
4. `app/v7/page.tsx` — Redirects to `/` (preserves any existing links)
5. `app/archive/current-home/page.tsx` — The previous NavigationCockpitV2 homepage, accessible only to authenticated admins
6. `app/archive/layout.tsx` — Auth gate (uses existing allowlist pattern from `app/test/layout.tsx`)

## Archive Access

The previous homepage is available at `/archive/current-home`, gated behind the existing admin allowlist. In development mode, it is open to all logged-in users. In production, only the email configured in `NEXT_PUBLIC_ALLOWED_EMAIL` can access it.

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

To revert: replace `app/page.tsx` with the archived version at `app/archive/current-home/page.tsx`.
