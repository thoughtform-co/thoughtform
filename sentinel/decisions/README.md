# Architecture Decision Records

> Documenting significant technical decisions with context and consequences.

---

## What is an ADR?

An Architecture Decision Record (ADR) captures a decision that has significant impact on the codebase. It documents:

- **Why** we made the decision (context)
- **What** we decided (the actual decision)
- **What follows** from that decision (consequences)

---

## When to Write an ADR

Write an ADR when you:

- Establish a pattern that others should follow
- Make a decision that might seem wrong without context
- Change direction from a previous approach
- Solve a problem that took significant research

---

## Index

| ADR | Title                                                                   | Status   | Date    |
| --- | ----------------------------------------------------------------------- | -------- | ------- |
| 001 | [Template](001-template.md)                                             | Example  | 2024-12 |
| 002 | [Scroll Animation Architecture](002-scroll-animation-architecture.md)   | Accepted | 2024-12 |
| 003 | [Auth Centralization](003-auth-centralization.md)                       | Accepted | 2024-12 |
| 004 | [Legacy Code Archival](004-legacy-code-archival.md)                     | Accepted | 2024-12 |
| 005 | [Scroll-Captured Content Reveal](005-scroll-captured-content-reveal.md) | Accepted | 2024-12 |

---

## Template

```markdown
# ADR-XXX: [Short Title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context

What is the issue we're facing? What constraints exist?

## Decision

What did we decide to do?

## Consequences

### Positive

- What becomes easier?

### Negative

- What becomes harder?
```
