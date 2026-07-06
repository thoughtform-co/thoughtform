# ADR-028: Landing Data Caching (tagged cache + on-demand revalidation)

**Date:** 2026-07-06
**Status:** Accepted
**Scope:** `lib/celestial/queries.ts`, `app/(marketing)/*/page.tsx`,
`app/api/celestial/{slots,designs}/route.ts`, `lib/v7-parse/parseBody.ts`.

## Context

The marketing pages prerender at build time (`/` is `○` static). Their
one data dependency — `getCelestialSlots()` (Supabase, service-role
client) — therefore baked whatever the **build environment** fetched
and never refreshed until the next deploy:

- Admin celestial edits were invisible in production until a redeploy.
- Localhost (dev renders per request → live rows) could legitimately
  show different connectors than Vercel (stale baked rows) — one of
  the "works on Vercel, differs on localhost" divergence classes.
- Separately, every dev-mode render re-read and re-parsed the 234 KB
  v7 prototype HTML **twice** (`getV7Content` + `extractV7Text`), with
  full regex surgery + CSS scoping each time.

Constraints: the `NEXT_OUTPUT_EXPORT=1` static-export packaging build
(`scripts/package-homepage-static.mjs`) is incompatible with
segment-level `export const revalidate`; the admin editor needs its
saves visible promptly; production must keep rendering (seed fallback)
when Supabase is down.

## Decision

1. **`unstable_cache` around the slots query**, not segment config:
   `getCelestialSlotsCached` (revalidate 300 s, tag
   `celestial-slots`). Next derives route-level ISR from the data
   cache — build output for `/` reads `Revalidate: 5m` — while export
   mode simply runs the query once at build, keeping the packaging
   script working.
2. **On-demand invalidation from the mutation routes**: the celestial
   slots/designs POST/DELETE handlers call
   `revalidateTag(CELESTIAL_SLOTS_TAG, "max")` after a successful
   write (Next 16 signature: profile arg required; `updateTag` is
   Server-Action-only). Admin saves reach production within one
   request instead of one deploy.
3. **Parse memoization**: `parseV7Html` results are cached at module
   scope keyed on `(htmlPath, tokensPath, JSON(options))` and
   validated against both files' mtimes — dev editing still
   re-parses; the double parse collapses to one.
4. **Bounded fetch + observability** (companion, same date):
   `getCelestialSlots` gained a 3.5 s timeout and structured fallback
   reasons; see BEST-PRACTICES "SSR data fetches need a timeout".

## Consequences

### Positive

- Supabase is out of the visitor request path entirely; `/` stays
  static with a 5-minute freshness ceiling and instant admin
  invalidation.
- Prod/localhost content converges (both see DB rows within ≤300 s or
  one admin save).
- Dev renders stop paying 2× file-read + parse per request.

### Negative / caveats

- A transient Supabase failure at revalidation time caches the **seed
  fallback** for up to 300 s (same blast radius as before, now
  time-boxed).
- The first served HTML after a deploy reflects the build
  environment's fetch; if the deploy build lacks
  `SUPABASE_SERVICE_ROLE_KEY`, visitors see seed connectors until the
  first revalidation cycle.
- `unstable_cache` is the pre-`'use cache'` API; when the repo adopts
  cacheComponents/dynamicIO, migrate this shape (tag + profile
  semantics carry over).

## Verification

`next build` route table shows `/` as `○` with `Revalidate 5m`;
`scripts/package-homepage-static.mjs` exits 0 with quarantine restore;
admin flow: save design → reload `/` → change visible without deploy;
`tests/lib/v7-parse.test.ts` green (parse memo is mtime-invalidated).
