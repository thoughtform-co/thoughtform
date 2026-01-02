# Sentinel

> Watching over the codebase. A collection of development practices, debugging guides, and architectural decisions for Thoughtform.co.

---

## What's Here

| File                | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `BEST-PRACTICES.md` | Patterns learned from real bugs in this codebase |
| `decisions/`        | Architecture Decision Records (ADRs)             |

---

## Philosophy

Sentinel is **not** a style guide. It documents:

- Patterns that prevent classes of bugs
- Architectural decisions and their rationale
- Cross-cutting concerns specific to this project

---

## When to Add Here

Add to Sentinel when you:

1. **Fix a bug that wasn't obvious** - Document the pattern so others don't hit it
2. **Make an architectural decision** - Create an ADR explaining the tradeoffs
3. **Discover a debugging technique** - Share it so others can find it
4. **See the same issue twice** - If it happened twice, it'll happen again

---

## Quick Links

### Best Practices

- [State Update Order](BEST-PRACTICES.md#-order-matters-update-dependent-state-before-dependent-state) - Prevent state resets from overwriting dependent values

### Architecture Decisions

- [Scroll Animation Architecture](decisions/002-scroll-animation-architecture.md)
- [Auth Centralization](decisions/003-auth-centralization.md)
- [Legacy Code Archival](decisions/004-legacy-code-archival.md)
- [Scroll-Captured Content Reveal](decisions/005-scroll-captured-content-reveal.md)
- [Focus Overlay System](decisions/006-focus-overlay-system.md)
- [Chamfered Card Polygon Design](decisions/007-chamfered-card-polygon-design.md)

---

## Project-Specific Context

This is the Thoughtform.co landing page - a Next.js 14+ app with:

- Complex scroll-driven animations (Lenis smooth scrolling)
- 3D particle system (Three.js)
- Supabase authentication (admin-only)
- Vercel KV for configuration storage

Key directories:

- `components/hud/` - Navigation cockpit, sigil, particle canvas
- `lib/hooks/` - Custom hooks for scroll metrics, auth, etc.
- `legacy/` - Archived code (excluded from build)

---

_"The best code is code that doesn't break in production."_
