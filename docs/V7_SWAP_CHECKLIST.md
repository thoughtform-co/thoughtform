# V7 Homepage Swap Checklist

When `app/v7/` is ready to replace the current production homepage at `app/page.tsx`, verify each item below before executing the swap.

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

- [ ] No WebGL / R3F dependency (intentionally lighter than current homepage)
- [ ] Lighthouse performance score >= 90 on mobile
- [ ] No layout shift during scroll transitions
- [ ] Fonts loading via font-display: swap, no FOIT

## Technical

- [ ] `app/v7/page.tsx` server component (metadata export works)
- [ ] No imports from `legacy/` or archived forks
- [ ] TypeScript compiles with zero new errors
- [ ] ESLint passes

## Swap Procedure

1. Move current `app/page.tsx` to `legacy/landing-current/page.tsx` (preserve rollback)
2. Move `app/v7/page.tsx` to `app/page.tsx` and `app/v7/LandingV7.tsx` to root-level or inline
3. Merge `app/v7/v7.css` font-face and token declarations into `app/styles/variables.css` (or keep scoped)
4. Update `app/layout.tsx` font loading if v7 fonts should apply globally
5. Delete or archive `app/v7/` route (no longer needed as separate staging)
6. Re-baseline `tests/visual/landing-page.spec.ts` — current tests assume NavigationCockpitV2 scroll thresholds
7. Run `npm run build` to confirm production build succeeds
8. Deploy to Vercel preview, verify all sections, then promote to production
