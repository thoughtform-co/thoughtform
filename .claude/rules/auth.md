---
paths:
  - "lib/auth/**"
  - "components/auth/**"
  - "app/api/**"
description: Auth allowlist, gates, and API authorization
---

# Rule: Auth & API routes

Client gates are **not** security. **Server** must validate tokens and admin allowlist for mutations.

**Read first**

- [ADR-003: Auth centralization](../sentinel/decisions/003-auth-centralization.md)
- `lib/auth/allowed-user.ts` — `isAllowedUserEmail()` (canonical check)
- Optional: `.cursor/rules/admin-access.mdc` (admin UX)

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) — any new public API or gate change should cite ADR-003 or add an ADR amendment.
