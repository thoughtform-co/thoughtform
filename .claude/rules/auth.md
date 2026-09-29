---
paths:
  - "lib/auth/**"
  - "components/auth/**"
  - "app/api/**"
description: Auth allowlist, gates, and API authorization
---

# Rule: Auth & API routes

Client gates are **not** security. **Server** must validate tokens and admin allowlist for mutations.

⚠ **THERE IS NO DEVELOPMENT BYPASS** ([ADR-003, amendment 2026-09-24](../sentinel/decisions/003-auth-centralization.md#amendment--2026-09-24-there-is-no-development-bypass)).
`isAuthorized` IS `verifyAllowlistedBearer` in every environment: `next dev`
listens on the LAN by default and runs with the production service-role key,
so a dev server that trusted every caller was the production database open on
café Wi-Fi. Dev signs in exactly as production does. The admin UI attaches its
token through `lib/auth/adminFetch.ts` (five sites used to send none and 401ed
in production); a bare `fetch("/api/…")` on an admin route is a bug.
`tests/lib/no-dev-auth-bypass.test.ts` walks the routes, the guards and the
admin gates for a `NODE_ENV === "development"` that came back; the two
dev-ONLY features it allows (a bench route that 404s in production,
`DevOnlyGate`) are not auth.

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
- ⚠ **The mint uses `verifyAllowlistedBearer`.** Until 2026-09-24
  `isAuthorized` / `requireAdmin` trusted everyone in development and a pass
  minted by a dev server that shares the key would have been valid in
  production; the shortcut is deleted now and the three are one verifier, but
  the mint keeps naming the strict one so the distinction survives in the
  source if a shortcut ever returns.
- ⚠ **The pass is not a session.** `Path=/arcs`, no identity inside it, and no
  file under `app/api/**` but the mint route may name it. It fails CLOSED: no
  key, or a short `OWNER_PASS_SECRET`, is the owner's own 404.
- ⚠ **The browser's half is lazy.** `AuthProvider` imports
  `lib/auth/ownerPassClient` inside its session callbacks only; a static import
  puts it on the anonymous path. It never imports `lib/auth/ownerPass`
  (`node:crypto`).
- ⚠ **The arcs below it are no longer public-by-link when a password is set**
  (ADR-135, next section). The overview keeps its own gate and is never keyed
  by the password.
- **Verifying:** `npx vitest run tests/lib/owner-pass*.test.ts
tests/lib/owner-gate-doctrine.test.ts`, then a real build:
  `$env:NEXT_DIST_DIR=".next-verify"; npx next build --webpack` and
  `node scripts/verify-owner-gate.mjs` (its own port — `npm run start` kills
  the dev server on :3003).

## The arcs' password (ADR-135)

Every page under `/arcs/<…>` asks for a password when one is set:
`ARC_PASSWORD_<KEY>` for one page (`/arcs/pandora-proposal` →
`ARC_PASSWORD_PANDORA_PROPOSAL`), else `ARCS_PASSWORD`, set in Vercel and
written nowhere in the repository.

- **`lib/arcs/arcGate.ts` is the one definition** (the key, the lookup, the
  token, the return path), Web Crypto only, shared by `proxy.ts` and
  `app/api/arcs/unlock/route.ts`. `/unlock` is a script-free form outside
  `/arcs/`, so the gate never gates its own door.
- ⚠ **It FAILS OPEN**: with neither variable set the page is served as
  before, which is every dev server and every deploy before the variables
  exist. Say so wherever the gate is described; never test "is it gated?" on
  a dev server without the variable.
- ⚠ **The key is taken from the PAGE the router will serve**, not the raw
  path (`arcPagePath`): `.rsc` and `.segments/…` payloads, percent-escapes
  (`/%61rcs/…`) and doubled slashes all key as their page — ADR-117's two
  leaks, closed in the key. A new way to spell a page is a new row in
  `arc-gate.test.ts` first.
- ⚠ **A path with a dot in its last segment is an ASSET and is never gated**:
  the homepage's own pictures live under `public/arcs/`.
- **The pass is a hash of the key and the password**, per page, httpOnly,
  30 days. It is not a session and names nobody; rotating the variable
  revokes every pass.
- **Verifying:** `npx vitest run tests/lib/arc-gate.test.ts`, then a real
  build with the variable set (`next build --webpack` into `.next-verify`,
  `next start -p 3011`). ⚠ Git Bash rewrites `next=/arcs/…` inside a curl form
  field; encode the slash. ⚠ The pass is `Secure` under production, so a curl
  jar over http drops it; send it as a header.
