# Sentinel

> Watching over the codebase. A collection of development practices, debugging guides, and architectural decisions for Thoughtform.co.

---

## What's Here

| File / area                            | Purpose                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [BEST-PRACTICES.md](BEST-PRACTICES.md) | Patterns that prevent **classes** of bugs                                                                          |
| [MAINTENANCE.md](MAINTENANCE.md)       | **Recurrence engine** — when to add ADRs, rules, and skills (Cycle A after fixes, Cycle B before new surface area) |
| [decisions/](decisions/)               | Architecture Decision Records (ADRs)                                                                               |
| [../LANGUAGE.md](../LANGUAGE.md)       | **Canonical vocabulary** (shared _Module / Seam_ terms + Thoughtform _Station / Actor_ terms)                      |
| [../.claude/rules/](../.claude/rules/) | **Path-scoped** rules for Claude Code (`paths:` globs)                                                             |
| [../.cursor/rules/](../.cursor/rules/) | **Path-scoped** rules for Cursor (`.mdc` + `globs`)                                                                |

Path-scoped rules **auto-load** when an agent works on matching files; they only **point** to ADRs and skills so context stays small.

---

## Philosophy

Sentinel is **not** a style guide. It documents:

- Patterns that prevent classes of bugs
- Architectural decisions and their rationale
- Cross-cutting concerns specific to this project

---

## When to add here

**Don’t improvise** — use [MAINTENANCE.md](MAINTENANCE.md): run **Cycle A** after a non-trivial fix, **Cycle B** before a new feature with its own files and rules. Trivial changes (typos, copy, formatting) skip capture; see [When to NOT capture](MAINTENANCE.md#when-to-not-capture).

---

## Quick links

### Best practices

- [State update order](BEST-PRACTICES.md#-order-matters-update-dependent-state-before-dependent-state) — parent/child dispatches
- [DOM Pinning & ScrollTrigger](BEST-PRACTICES.md#-dom-pinning--scrolltrigger-brandmark--fixed-actors) — fixed brandmark + GSAP
- [After a non-trivial fix](BEST-PRACTICES.md#-after-a-non-trivial-fix) — link to post-incident flow

### Architecture decisions (index)

| ADR | Title                                                                             |
| --- | --------------------------------------------------------------------------------- |
| 001 | [Template](decisions/001-template.md)                                             |
| 002 | [Scroll animation architecture](decisions/002-scroll-animation-architecture.md)   |
| 003 | [Auth centralization](decisions/003-auth-centralization.md)                       |
| 004 | [Legacy code archival](decisions/004-legacy-code-archival.md)                     |
| 005 | [Scroll-captured content reveal](decisions/005-scroll-captured-content-reveal.md) |
| 006 | [Focus overlay system](decisions/006-focus-overlay-system.md)                     |
| 007 | [Chamfered card polygon design](decisions/007-chamfered-card-polygon-design.md)   |
| 008 | [Landing v7 background layers](decisions/008-landing-v7-background-layers.md)     |
| 009 | [Repo structure conventions](decisions/009-repo-structure-conventions.md)         |
| 010 | [Brandmark choreography](decisions/010-brandmark-choreography.md)                 |

Full table with status: [decisions/README.md](decisions/README.md).

### Path-scoped rules (this repo)

| Rule file                                                                     | Globs (summary)                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`.claude/rules/landing-v7.md`](../.claude/rules/landing-v7.md)               | `components/landing/v7/**`, `app/(marketing)/**`        |
| [`.claude/rules/brandmark.md`](../.claude/rules/brandmark.md)                 | `useSigilChoreography`, `BrandmarkActor`, `landing.css` |
| [`.claude/rules/scroll-animations.md`](../.claude/rules/scroll-animations.md) | `useScroll*`, `NavigationCockpitV2/hooks`               |
| [`.claude/rules/auth.md`](../.claude/rules/auth.md)                           | `lib/auth`, `components/auth`, `app/api`                |
| [`.claude/rules/supabase.md`](../.claude/rules/supabase.md)                   | `supabase/**`, `lib/celestial/**`                       |
| [`.claude/rules/legacy.md`](../.claude/rules/legacy.md)                       | `legacy/**`                                             |

Each rule cites [MAINTENANCE.md](MAINTENANCE.md) for when to add ADRs or skills. Cursor copies live beside them as `*.mdc` in [`.cursor/rules/`](../.cursor/rules/).

---

_"The best code is code that doesn't break in production."_
