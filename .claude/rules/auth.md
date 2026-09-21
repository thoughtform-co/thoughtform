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

## The owner's pass (ADR-117)

`/arcs` — the overview that lists every client — is the owner's page. It is
gated IN THE PAGE on a signed cookie, never in `proxy.ts` and never by a
client-side gate.

- ⚠ **A client gate hides pixels and ships the data.** The site's session is
  in localStorage; a server render cannot see it. Anything private must be
  decided on the server before it renders.
- ⚠ **A proxy path check leaks.** A prerendered page leaves `.rsc` and
  `.segments/*.segment.rsc` files whose URLs reach the proxy under another
  pathname, and `/%61rcs` resolves to the page under `next start`. The page is
  `force-dynamic` and calls `assertOwner()` first.
- ⚠ **The mint uses `verifyAllowlistedBearer`, never `isAuthorized` /
  `requireAdmin`** — those trust everyone in development, and a pass minted by
  a dev server that shares the key is valid in production.
- ⚠ **The pass is not a session.** `Path=/arcs`, no identity inside it, and no
  file under `app/api/**` but the mint route may name it. It fails CLOSED: no
  key, or a short `OWNER_PASS_SECRET`, is the owner's own 404.
- ⚠ **The browser's half is lazy.** `AuthProvider` imports
  `lib/auth/ownerPassClient` inside its session callbacks only; a static import
  puts it on the anonymous path. It never imports `lib/auth/ownerPass`
  (`node:crypto`).
- **Verifying:** `npx vitest run tests/lib/owner-pass*.test.ts
tests/lib/owner-gate-doctrine.test.ts`, then a real build:
  `$env:NEXT_DIST_DIR=".next-verify"; npx next build --webpack` and
  `node scripts/verify-owner-gate.mjs` (its own port — `npm run start` kills
  the dev server on :3003).
