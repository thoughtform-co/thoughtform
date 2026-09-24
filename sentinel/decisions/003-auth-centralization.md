# ADR-003: Auth Centralization

**Date:** 2024-12  
**Status:** Accepted

---

## Context

This is a personal landing page with admin functionality (particle config editor). Only one user should be able to log in.

Previously, auth was scattered:

- `NEXT_PUBLIC_ALLOWED_EMAIL` checked in multiple places
- Client-side checks in `AdminGate`, `LoginModal`, `signInWithMagicLink`
- Server-side checks in API routes using different patterns
- No consistent way to verify authorization on API requests

Issues:

1. **Inconsistent checks** - Same logic duplicated, risk of drift
2. **Insecure API routes** - Easy to forget auth checks
3. **No server-side token validation** - API routes trusted client assertions

---

## Decision

### 1. Centralized allowed email check

Single source of truth for email validation:

```typescript
// lib/auth/allowed-user.ts
export function isAllowedEmail(email: string | undefined): boolean {
  const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
  return !!email && !!allowedEmail && email === allowedEmail;
}

export async function isAllowedUser(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAllowedEmail(user?.email);
}
```

### 2. Server-side authorization with Bearer token

API routes extract and validate tokens:

```typescript
// lib/auth-server.ts
export async function isAuthorized(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  return isAllowedEmail(user?.email);
}
```

### 3. Client passes token in requests

Protected API calls include auth header:

```typescript
// lib/contexts/ParticleConfigContext.tsx
const {
  data: { session },
} = await supabase.auth.getSession();

await fetch("/api/particles/config", {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  },
});
```

---

## Alternatives Considered

### Alternative 1: Middleware-only auth

- **Pros:** Single check point
- **Cons:** Can't protect individual API routes differently

### Alternative 2: Session cookies instead of Bearer tokens

- **Pros:** Automatic inclusion in requests
- **Cons:** CSRF concerns, Supabase client already handles tokens

### Alternative 3: Keep distributed checks

- **Pros:** No refactoring
- **Cons:** Risk of inconsistent/forgotten checks

---

## Consequences

### Positive

- **Single source of truth** - `isAllowedEmail()` used everywhere
- **Secure API routes** - Token validated server-side
- **Easy to audit** - Search for `isAllowedEmail` to find all auth points
- **Type-safe** - Function signatures enforce correct usage

### Negative

- **Must remember to pass token** - Client code needs to include header
- **Extra network latency** - Token validation on each protected request

### Neutral

- Auth logic now in `lib/auth/` and `lib/auth-server.ts`

---

## Implementation Files

- `lib/auth/allowed-user.ts` - Centralized email check
- `lib/auth-server.ts` - Server-side `isAuthorized()`
- `components/admin/AdminGate.tsx` - Uses `isAllowedEmail`
- `components/auth/LoginModal.tsx` - Uses `isAllowedEmail`
- `app/api/particles/config/route.ts` - Uses `isAuthorized()`
- `lib/contexts/ParticleConfigContext.tsx` - Passes Bearer token

---

## Security Notes

- `NEXT_PUBLIC_ALLOWED_EMAIL` is intentionally public (just an email)
- Actual auth is via Supabase magic link + token validation
- Never trust client-side auth state for server operations

---

## Amendment — 2026-09-21: the owner's pass ([ADR-117](117-the-owners-pass.md))

One cookie now exists beside the Bearer model, and Alternative 2's CSRF
reasoning does not reach it, because it is not a session:

- **`tf_owner`** = `v1.<expiry>.<HMAC>` — no identity, no Supabase token, a
  derived key, fails closed, 7 days.
- **Minted only by `POST /api/owner-pass`**, behind
  `verifyAllowlistedBearer` — the Bearer check of §2 with **no development
  bypass** (`isAuthorized` keeps its shortcut and now delegates to it).
- **Authorises one GET render of one page**, `/arcs`, checked in the page
  (`lib/auth/ownerGate.ts`), never in `proxy.ts`. `Path=/arcs`, so the browser
  never sends it to `/api/*`; no API route may read it
  (`tests/lib/owner-gate-doctrine.test.ts`). `requireAdmin` stays Bearer-only.

---

## Amendment — 2026-09-24: there is no development bypass

A whole-codebase review found the thing this ADR's §2 model had been carrying
since the beginning: `isAuthorized` returned `true` for every caller under
`NODE_ENV=development`, "for easier testing". Three facts made that production
exposure rather than a convenience:

1. **`next dev` binds to every interface by default** (`-H 0.0.0.0` in Next
   16's own help), and `scripts/dev-server.mjs` passes no host. The dev server
   is reachable from any device on the same network — which is also how the
   owner's phone reads work.
2. **The dev server runs with the production service-role key.** The owner's
   pass (ADR-117) had already refused the shortcut for exactly this reason: a
   pass minted through it would have been valid in production.
3. **Twenty-nine admin routes sat behind the shortcut** — database and storage
   writes, and eight that spend Anthropic, Replicate, Voyage and Figma keys —
   so anyone on café Wi-Fi could `DELETE /api/voices/upload`, `POST
/api/particles/config` or run `/api/survey/analyze` on the site's key, no
   token needed, with the writes landing on the live project.

**The bypass is deleted**, and everything that leaned on it with it:

- `isAuthorized` IS `verifyAllowlistedBearer` — one check, every environment;
  the name stays because twenty-nine routes call it. `getServerUser` no longer
  invents a user with the allowlisted email when no token is sent.
- The three inline `&& process.env.NODE_ENV !== "development"` clauses on the
  survey items routes are gone (they inserted rows with `user_id: null`).
- The client-side gates — `app/(admin)/layout.tsx`, `AdminGate`, the
  astrogation page's `BYPASS_AUTH`, the celestial editor's overlay and gate —
  no longer short-circuit on `NODE_ENV`. The allowlisted email is the gate in
  every environment; ADR-117's rule that a client gate is not security is
  unchanged.
- **The admin UI relied on the bypass without knowing it.** Fourteen fetches —
  the orrery's presets (3), the astrogation Figma bridge (7), the reference
  match (2), a segment delete and the gateway bake upload — sent no token at
  all: they worked on the dev server by accident and answered 401 in
  production, unnoticed. They go through **`lib/auth/adminFetch.ts`** now,
  which reads the browser client's session at call time and attaches the
  bearer (a module-level store with no React context can use it exactly as a
  component can). The hooks that already attached a token are untouched.
- `.env.example` stops saying the service-role key is optional "because the
  bypass short-circuits"; it never depended on the key.

**Dev is production now.** The owner signs in at `/admin` on the dev server as
on the site; a signed-out dev session sees the admin tools redirect and every
admin route answer 401 — measured on the running dev server for the presets
route (GET and DELETE), the survey items POST, the design MCP route and the
Figma file route.

**Guards.** `tests/lib/no-dev-auth-bypass.test.ts` walks `lib/auth-server.ts`,
`lib/api/guards.ts`, `app/api/**`, `app/(admin)/**` and `components/admin/**`
and fails on any `NODE_ENV === "development"` outside two allowed dev-ONLY
features (a bench route that 404s in production; `DevOnlyGate`, a panel that
renders nowhere else); it also pins `isAuthorized`'s body and that the five
once-bare fetches import `adminFetch`. `tests/lib/owner-pass-route.test.ts`
now asserts the shortcut's ABSENCE under a stubbed development `NODE_ENV`,
where it used to pin its presence.

**The 2026-09-21 amendment's parenthesis** — "`isAuthorized` keeps its shortcut
and now delegates to it" — is superseded by this one: there is no shortcut to
keep.
