# ADR-117 — The owner's pass: `/arcs` is the owner's page, gated in the page

- **Status:** Proposed (2026-09-21) — shipped and guarded; the production curl
  after deploy is the last proof (§Verification).
- **Surface:** `/arcs`, the overview that lists every client's engagements —
  and only it. `/arcs/<client>` and every arc (`/arcs/<slug>`) stay
  public-by-link, untouched.
- **Amends:** [ADR-003](003-auth-centralization.md) (a narrow, cookie-borne
  capability beside the Bearer model, §The pass is not a session).
- **Related:** [ADR-052](052-client-arcs.md) (the arcs were unlisted, noindex,
  "no gate" — the overview now has one), [ADR-098](098-arcs-clients-and-the-proposal.md)
  (the client model the overview renders), [ADR-114](114-the-sheet.md) (the
  sheet the overview is today), [ADR-059 U3/U5](059-rail-instruments.md) (no
  login affordance on a public page; the session panel), the landing-performance
  doctrine (Supabase stays off the anonymous path), ADR-037 (the RLS trust
  boundary this does not touch).
- **Rules:** [`.claude/rules/auth.md`](../../.claude/rules/auth.md).

## The ask

Owner, 2026-09-21, opening the brief that redesigns the overview:

> First off, this page should only be accessible to me when I am logged in, so
> it should not be accessible to external people.

Decided with him the same morning: gate the overview only, with a real
server-side gate; the client pages and the arcs stay public-by-link (each shows
one client's own work, and no link a client already holds may break); the
repository's own visibility — it is public, so `lib/arcs` is readable in
source whatever the site does — is his separate switch.

## What was measured before deciding

- **The site's auth is client-side.** The Supabase session lives in
  localStorage (`lib/supabase.ts`, a bare `createClient`); `AuthProvider` loads
  the client lazily and only when a persisted token exists. There is no auth
  cookie, no `@supabase/ssr`, no `cookies()` anywhere. A server render cannot
  see who is asking, so a client-side `AdminGate` around the page would hide
  its pixels while shipping every client's name in the HTML and the RSC
  payload to anyone.
- **The overview was STATIC.** The last build held `server/app/arcs.html`,
  `arcs.rsc` and `arcs.segments/` — and `arcs.segments/_full.segment.rsc`
  (36,789 bytes) carried "Hungry Minds" and the rest.
- **So a gate in `proxy.ts` would have leaked.** The compiled proxy matcher
  admits `(\.json|\.rsc|\.segments\/.+\.segment\.rsc)?` suffixes and the
  adapter strips only a trailing `.rsc`, so `GET /arcs.segments/_full.segment.rsc`
  reaches the proxy as `pathname === "/arcs.segments/_full.segment"` and walks
  past an exact-path check; the segment normaliser is installed only in
  Vercel's `minimalMode`, so a local `next start` would not even reproduce it.
  Under `next start`, `/%61rcs` resolves to the page while the proxy sees the
  undecoded string. And a proxy predicate that is wrong in the other direction
  404s a page a client holds a link to.

## Decision

### 1 · The gate is in the page

`app/(marketing)/arcs/page.tsx` exports `dynamic = "force-dynamic"` and its
first act is `await assertOwner()` (`lib/auth/ownerGate.ts`): read the pass
cookie, verify it, `notFound()` on failure. Nothing is prerendered, so no
artefact exists under any URL shape, and every transport — the document, an
`RSC: 1` request, a prefetch — runs the same check. `generateMetadata` asks the
same question, so a denied request carries the root's title exactly like any
other 404. `proxy.ts` is untouched.

The cost, named: the overview renders per request (it parses the prototype for
the HUD chrome each time). It is one person's page.

### 2 · The pass

`lib/auth/ownerPass.ts` — pure, server-only (`node:crypto`):

- the cookie `tf_owner` = `v1.<expiry>.<HMAC-SHA256>`, unpadded base64url;
- verified with `timingSafeEqual`; refused when expired, malformed, of another
  version, signed by another key, or claiming a longer life than any mint
  gives (7 days + 60 s of skew);
- the key is DERIVED with HKDF (`thoughtform/owner-pass/v1`) from
  `OWNER_PASS_SECRET` when set, else from the service-role key the API routes
  already hold — so the first deploy works with nothing configured, and the
  raw root is never the signing key;
- ⚠ **IT FAILS CLOSED.** No root, or a dedicated secret under 32 characters,
  yields no key and the overview is a 404 — the owner's own included. A short
  secret does NOT fall back to the service key: that would hide the
  misconfiguration behind a gate that still works;
- enforced in production and under `OWNER_GATE=enforce`; OPEN under `next dev`
  so the eval capture and the smokes reach the page. There is no value that
  turns it off in production.

### 3 · The mint

`POST /api/owner-pass` answers only to a Bearer token that resolves to a real
Supabase user with the allowlisted email, through
`verifyAllowlistedBearer` — **the strict verifier, with no development
bypass**. `isAuthorized` keeps its DX shortcut and now delegates to it, byte
for byte the same behaviour. ⚠ The mint may never use `isAuthorized` /
`requireAdmin`: under `next dev` they trust everyone, and a dev server that
shares the production key (the phone passes put it on the LAN) would mint a
pass valid in production. `DELETE` clears the cookie; it needs no auth.

The cookie: `HttpOnly` · `SameSite=Lax` (Strict would 404 the owner following a
link to the overview from Slack or Notion) · `Secure` in production ·
**`Path=/arcs`** — the browser never sends it to `/api/*`, so no API route can
be authorised by it even by accident.

### 4 · The browser's half rides the session

`AuthProvider` lazily imports `lib/auth/ownerPassClient.ts` inside its session
callbacks: on the initial session, `SIGNED_IN` and `TOKEN_REFRESHED` it mints
when the email is allowlisted and the mirrored expiry (localStorage) is under
half the pass's life; on `SIGNED_OUT` it clears. `lib/auth.ts`'s `signOut`
clears too. A visitor with no session never fetches the module — the
anonymous path gains no bytes and no Supabase.

⚠ **THE MIRROR CAN LIE; THE 404 CORRECTS IT.** A cleared cookie leaves a
fresh-looking mirror behind. The not-found page carries `data-tf-404`; when the
owner lands on the overview's 404 with a session, the module mints regardless
of the mirror and reloads ONCE per tab (sessionStorage), which is also how an
expired pass or a rotated key heals. A reload never follows a failed mint, and
the overview rendering re-arms it.

The session panel (bottom-right, ADR-059 U5) gains an `Arcs` row — a plain
`<a>`, never `Link`, because the router may hold a prefetched 404 from before
the mint. No login affordance appears anywhere public: the door stays
`/admin`.

### 5 · The pass is not a session (the ADR-003 amendment)

ADR-003 rejected session cookies for API authorisation over CSRF. This cookie
is not that: it carries no identity and no Supabase token, it is minted only
by a Bearer-verified POST (a cross-site form cannot set the header, a
cross-site fetch cannot pass the preflight), it authorises one GET render of
one page, and no file under `app/api/**` but the mint route may name it
(`owner-gate-doctrine` scans for it). `requireAdmin` stays Bearer-only.

### 6 · What else had to move

- `scripts/package-homepage-static.mjs` quarantines the overview (a
  force-dynamic page cannot be exported, and the shareable zip carried
  `arcs.html` until now) and names `proxy.ts` where it still named the
  deleted `middleware.ts`.
- `scripts/sweep-csp-enforced.mjs` signs a pass when handed the server's own
  `OWNER_PASS_SECRET`, and SKIPS `/arcs` loudly otherwise — never sweeping a
  404 that happens to live at that path.
- `lib/env.ts` and `.env.example` document `OWNER_PASS_SECRET` (a secret) and
  `OWNER_GATE`.
- No `X-Robots-Tag` header: the owner's render carries `noindex` in its
  metadata, and a header on the path would make the stranger's 404
  distinguishable from any other.

## Alternatives rejected

- **A client-side `AdminGate`** — hides pixels, ships the data.
- **A cookie check in `proxy.ts`** — leaks through the RSC/segment shapes and
  the encoded path (above), and can 404 a client's page.
- **`@supabase/ssr` cookie sessions** — a second session model for one page,
  ADR-003's rejected alternative, and Supabase on the anonymous path.
- **A shared password / basic auth** — a second credential to leak and
  rotate; the owner already has a sign-in.
- **Moving the arcs data behind Supabase RLS** — the only way the SOURCE stops
  exposing the list; its own pass, offered and not taken today.

## Verification

- `tests/lib/owner-pass.test.ts` — the format, every refusal, fail-closed, the
  derived key, enforcement, the cookie's attributes, the restated re-mint
  constant.
- `tests/lib/owner-pass-route.test.ts` — no/bad Bearer → 401 and no cookie,
  **development without a token → still 401**, a mint the server's own
  verifier accepts, 503 with no key, DELETE.
- `tests/lib/owner-pass-client.test.ts` — when the browser mints, when it
  stays quiet, the single reload.
- `tests/lib/owner-gate-doctrine.test.ts` — the page is force-dynamic and
  gates first; the gate is not in `proxy.ts`; no API route reads the pass; no
  client component imports the signer; the provider imports its half lazily;
  the export skips the overview.
- `scripts/verify-owner-gate.mjs` against a real build in `.next-verify` (its
  own port — `npm run start` would kill the dev server): no prerendered
  `arcs.*`; no static chunk carries the client list; anonymous `/arcs`, with
  `RSC: 1`, as a prefetch, `/arcs.rsc`, `/arcs.segments/_full.segment.rsc`,
  `/%61rcs`, `/ARCS`, `/arcs/` all 404 with nothing lettered and the ordinary
  404's title; expired, tampered, another version, another key and too
  long-lived passes 404; a valid pass renders every client, uncached, under
  its own title; the mint refuses a missing and a forged bearer; the client
  pages and the arcs stay 200.
- After deploy, the anonymous shapes are curled against production — the
  segment shape can only be proven there.

## Left open

- ⚠ **EVERY PAGE OF THE SITE NAMES THE FOUR PROPOSAL ROUTES**, found by this
  pass's own verification: the root layout's inline head scripts carry
  `LIGHT_LOCKED_ROUTES` (`lib/theme/themeLock.ts`) and `HERO_ROUTES`
  (`lib/theme/heroPreload.ts`) as plain strings, so the homepage's source —
  and every 404's — lists `/arcs/hungry-minds-proposal`,
  `/arcs/perfect-ted-proposal`, `/arcs/suri-proposal` and
  `/arcs/trinny-london/proposal` (measured: four occurrences each in
  `index.html`). The gate hides the overview; this still makes the client
  list discoverable from any page. Pre-existing (ADR-093/ADR-075/ADR-098), not
  taken here; the pre-paint scripts need a route test that does not letter
  the routes. `verify-owner-gate` tests for overview CONTENT (client names),
  never for the slugs, for exactly this reason.
- **On Vercel `/%61rcs` answers 500, not 404** (measured after deploy,
  2026-09-21). Vercel resolves percent-encoded paths to their routes
  (`/%68ome-sessions` is 200), so the encoded overview reaches the page, and
  there the gate's `notFound()` renders as Next's generic error shell. No
  client data is in it and local `next start` answers 404; recorded, not
  chased.
- **`OWNER_PASS_SECRET` in Vercel** (Production and Preview — previews run as
  production, and the owner signs in per preview host). Not needed on day one;
  the derived key works. The owner generates and sets it; no session reads or
  prints a value.
- **The repository is public**, so the gate hides the page and not the source.
- A bfcache copy of the overview can survive a sign-out in the owner's own
  browser; the page is `no-store`, which most browsers honour for bfcache.
