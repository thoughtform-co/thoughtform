# ADR-135 — The arcs sit behind a password

- **Status:** Proposed (2026-09-29) — shipped and guarded; verified on a
  production build on this machine; the live read after the deploy is the last
  proof.
- **Surface:** every page under `/arcs/<…>` (the client pages, the arcs, the
  Trinny pitch nested under its client). Not `/arcs` itself, which keeps its
  owner gate, and not a static file under `public/arcs/`.
- **Amends:** [ADR-117](117-the-owners-pass.md), whose "`/arcs/<client>` and
  every arc stay public-by-link" is reversed whenever a password is set.
- **Related:** [ADR-052](052-client-arcs.md) (the arcs were unlisted and
  noindex, with no gate), [ADR-098](098-arcs-clients-and-the-proposal.md) (the
  client model), [ADR-128](128-the-pandora-proposal-and-two-kinds.md) and
  [ADR-133](133-the-configuration-travels.md) (the Pandora proposal, the one
  running proposal), [ADR-003](003-auth-centralization.md) (the Bearer model
  this does not touch).
- **Rules:** [`.claude/rules/auth.md`](../../.claude/rules/auth.md) §The arcs'
  password, [`.claude/rules/arcs.md`](../../.claude/rules/arcs.md).

## The ask

Owner, 2026-09-29, with the proposal about to go out as a PDF and a link:

> I want you to put all the arcs under a password, which I will set in Vercel
> … this is the only running proposal so we need a password specifically for
> the Pandora proposal.

He named the Pandora password in the same message; it is set in Vercel and
written nowhere in the repository.

## The decision

A password per page, read from the environment, most specific first:

| variable             | covers                                         |
| -------------------- | ---------------------------------------------- |
| `ARC_PASSWORD_<KEY>` | one page, e.g. `ARC_PASSWORD_PANDORA_PROPOSAL` |
| `ARCS_PASSWORD`      | every other arc page                           |

The key is the page's path under `/arcs/` in the environment's own shape:
`/arcs/pandora-proposal` → `PANDORA_PROPOSAL`,
`/arcs/trinny-london/proposal` → `TRINNY_LONDON_PROPOSAL`.

- **`proxy.ts` is the door.** A request for a gated page without a valid pass
  is redirected (307) to `/unlock?next=<the page>`. The pass is an httpOnly,
  SameSite=Lax cookie per page (`tf_arc_<key>`, 30 days, Secure in
  production) whose value is a SHA-256 of the key and the password, never the
  password. Changing the password in Vercel invalidates every pass issued
  under the old one.
- **`/unlock` is a server-rendered, script-free form** that posts to
  `/api/arcs/unlock`. The route compares, sets the pass and 303s back; a miss
  303s back to the form with `?error=1`. `next` must be an arc page on this
  site (`safeArcNext`), so the route cannot redirect off it. CSP's
  `form-action 'self'` allows the post and the redirect.
- **It fails open.** With neither variable set, the page is served as before.
  Every local dev server and every deploy made before the variables exist
  behave exactly as they did; failing closed would have locked every link a
  client already holds on the push. The gate arms the moment a variable is
  set, with no deploy of code.
- **`lib/arcs/arcGate.ts` is the one definition** of the key, the password
  lookup, the token and the return path. Web Crypto only, no Node built-ins,
  shared by the proxy and the route.

## What ADR-117 already knew, and what this does about it

ADR-117 gated the overview IN THE PAGE because "a proxy path check leaks", and
named the two ways. Both are closed in the key, not hoped away:

- **The prerendered payloads.** A static page also answers as
  `/arcs/<slug>.rsc` and `/arcs/<slug>.segments/…/*.segment.rsc`.
  `arcPagePath` strips both suffixes before keying, so a payload is gated with
  its page, and the reader is sent back to the page, never to the payload.
- **The escaped spelling.** The router decodes what the proxy sees raw
  (`/%61rcs/x` is `/arcs/x`); the path is decoded before keying, and repeated
  slashes collapse.

The page is still prerendered (the arcs keep their static HTML, and the proxy
runs before the cache on every matched path). That is what keeps the arcs
fast, and it is why the in-page gate ADR-117 used for one owner page was not
copied to every arc. **No client component imports the arc registry or a
content module** (checked for this pass), so no JavaScript chunk carries a
proposal's copy.

## What it is and is not

A password on a link, sized to a proposal: it stops a forwarded or guessed URL
from opening the page. It is not an account, it names no reader, and one
password opens the page for everyone who has it. The repository is public, so
`lib/arcs/content/*` is readable in source whatever the site does; that is the
owner's separate switch, as ADR-117 recorded.

## Verification

- `tests/lib/arc-gate.test.ts`: the key and its exclusions (the overview,
  assets under `/arcs/`, every other route), the two leaks (`.rsc`,
  `.segments`, `%61rcs`, `//`), the precedence and the fail-open, the token
  never containing the password, the return path refusing another origin, and
  end to end through `proxy` and `POST`.
- A production build (`next build --webpack` into `.next-verify`, `next start`
  on 3011 with the Pandora variable set), probed with curl and a real browser:
  the page, its `.rsc`, a `.segments` payload and `/%61rcs/…` all 307 to
  `/unlock`; `/arcs//…` 308s to the page and is then gated; the other arcs and
  an asset under `/arcs/` serve 200; a wrong password returns to the form with
  the error; the right one sets the pass and lands on the page; a forged pass
  is refused. The build lists the proxy on the Node runtime (an empty
  `middleware-manifest.json`), so it reads its environment at request time on
  Vercel.

## Findings worth keeping

- ⚠ **GIT BASH REWRITES A `/route` INSIDE A FORM FIELD.** `curl -F
next=/arcs/x` sent a Windows path and the route answered as if `next` were
  invalid; the route was right and the probe was wrong. Encode the slash
  (`%2F`) or run the probe from PowerShell.
- ⚠ **A SECURE COOKIE DOES NOT RIDE A CURL JAR OVER HTTP.** Under
  `NODE_ENV=production` the pass is `Secure`; send it as a header to probe a
  local build. Chromium treats `localhost` as secure and keeps it.

## Left open

- `ARCS_PASSWORD` is the owner's to set. Until he does, every arc but the
  Pandora proposal stays open, as before.
- The fragment of a gated link (`#phases`) is lost across the password page:
  the browser never sends it to the server. The page opens at its top.
- A reader who opens a gated page from another page through the client router
  gets a full-page load to `/unlock`, not an in-app transition.
