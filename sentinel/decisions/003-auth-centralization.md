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
