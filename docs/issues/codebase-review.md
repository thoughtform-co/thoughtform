# Codebase Review Notes

## Critical issues

- Secrets are present in a local env file in the repo workspace. This includes a Supabase service role key and Upstash KV tokens. If the file is tracked or shared, rotate immediately and purge from history.
  - .env.local:2
  - .env.local:5
  - .env.local:8
  - .env.local:9
  - .env.local:11

## High severity

- User-specific particle configs can be fetched by arbitrary userId without auth, using a service-role client that bypasses RLS. This is a data exposure vector if user configs are not public.
  - app/api/particles/config/route.ts:20
  - app/api/particles/config/route.ts:23
  - app/api/particles/config/route.ts:27

## Medium severity

- Admin write/delete endpoints are effectively disabled in production because isAuthorized always returns false, so POST/DELETE will always 401.
  - lib/auth-server.ts:33
  - lib/auth-server.ts:41
  - app/api/particles/config/route.ts:82
  - app/api/particles/config/route.ts:86

## Low-hanging fruit

- Implement server-side auth (middleware or API guard) and derive userId from the session rather than trusting query/body; gate GET/POST/DELETE consistently.
  - lib/auth-server.ts:33
  - app/api/particles/config/route.ts:18
  - app/api/particles/config/route.ts:78
- Add schema validation and range clamping for config payloads to avoid malformed data causing rendering/perf issues.
  - app/api/particles/config/route.ts:90
  - lib/particle-config.ts
- Clean up mojibake/encoding artifacts in comments and strings.
  - store/editor-store.ts:236
  - types/content.ts:1
  - tailwind.config.ts:10
  - README.md:3

## Open questions / assumptions

- Are user-specific configs considered sensitive? If public by design, the GET exposure risk is lower.
- Is .env.local tracked or shared anywhere (git history, backups, shared Dropbox)? If yes, rotate keys and purge history.
