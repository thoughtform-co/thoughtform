# ADR-052: Client arcs — deck pages on the HUD slice (/arcs)

**Date:** 2026-07-27
**Status:** Accepted
**Surfaces:** `app/(marketing)/arcs/**`, `components/arcs/**`, `lib/arcs/**`, `public/arcs/**`
**Related:** ADR-002 (one scroll writer), ADR-008 (layered compositing), ADR-022 (hero curtain), ADR-031 U16 (hero-lift clip reveal), ADR-043 (wordmark), ADR-044/048 (masthead + editorial band), ADR-029/050 (the card face this grid mirrors)

## Context

Client-facing decks (workshops, keynotes) lived in the separate Shards repo
(`01_thoughtform_shards`) as light-paper Next.js pages with their own chrome,
content spread between `content/*.ts` modules and page-local override consts,
and nine parallax pair-scroll components. Replacing PowerPoints with landing
pages is the point — but the pages must read as **thoughtform.co**: the HUD
rails, the survey masthead, the card-face grammar, the wordmark, the hero
curtain.

## Decision

### Routes — public but unlisted

`/arcs` (overview) and `/arcs/[slug]` (one page per client arc) in
`app/(marketing)/`, every route `robots: noindex, nofollow`. No gate —
reachable by link only. Slugs are statically generated from the registry
(`dynamicParams = false`; unknown slug → 404). **Next 16: route `params` is a
Promise** — `await params` in the page and `generateMetadata`.

### Chrome — the slice, not a fork

Both routes get the production HUD verbatim from
`sliceV7Sections([])` (`lib/v7-parse/sliceSections.ts`) — corner brackets,
both rails with the parse-injected 13-tick ladders, the dormant rail-manifest
skeleton, and the `.hud__brand` wordmark. `ArcShell` (the ONE stateful
component) injects it via `dangerouslySetInnerHTML` + `suppressHydrationWarning`.
The prototype HTML and `lib/v7-parse/**` are consumed **read-only** — the
byte-pinned parse tests stay green by construction. Nothing ever mounts into
the injected markup (the manifest skeleton stays dormant; ADR-031's
no-`createRoot` rule).

Two chrome facts every future edit must respect:

1. **`--hero-lift` gates rail visibility** (landing.css clips). Detail pages
   write it linearly from scroll (`useArcScroll`) so the hero curtain
   clip-uncovers the rails exactly like the landing; the overview has no
   curtain and pins `--hero-lift: 1` statically on the root. Rails missing =
   check this var first.
2. **Compositing (ADR-008):** the slice ships the fixed `.gateway` radial.
   Arcs kill it (`.arc-root .gateway { display: none }`) AND keep every
   section opaque void (`.arc-section`), and the hero card itself never
   fades/transforms — only `.hero__content` moves on `--hero-cover`.

The scroll writer (`useArcScroll`) is the page's single writer (ADR-002):
`--hero-lift` (html), `--hero-cover` (hero el), `--py` per `[data-parallax]`,
the `.hud__brand` `is-collapsed` dock at 0.5vh (class on the element, the
HudNav pattern), and the `data-arc-scrolled` menu gate at 1vh. It never
touches corridor channels. The retired `.hud__depth` scroll diamond stays
retired (display: none in landing.css) — the writer does not drive it.

### Content — data, not pages

`lib/arcs/types.ts` defines a 9-primitive discriminated union
(`head · cards · list-groups · anatomy · interstitial · media · portrait ·
close`) + `ArcDef`; one content module per arc in `lib/arcs/content/`;
`registry.ts` is the single source of order and slugs;
`tests/lib/arcs-registry.test.ts` pins slugs, unique section ids, close-last,
rooted asset paths, and the **no-italics contract** (emphasis travels as
`ArcTitle.em` → upright gold; markup in copy strings is a test failure).

**Flattening doctrine:** interactive Shards machinery ports as static
primitives — role filters freeze to their default, carousels/tabs become
grouped lists, the nine parallax pairs stack plainly, the sticky header is
replaced by the HUD + the left reel menu (`ArcMenu`, IO-driven, ≥1101×760,
visible past the hero). The IO reveal keeps the Shards visible-by-default
contract (`is-arc-js` opt-in). Videos are `preload="none"` + poster, never
autoplay; gated `.skill` downloads do not port (no download API here —
public repos link out, internal bundles are "on request").

### The grammars are COPIED, never imported

`arcs.css` is the one page sheet; every rule is `.arc-*`. The corridor sheets
(home-v2.css, services.css) are coupled to corridor scroll state and are NOT
imported — the four borrowed grammars live as copies: station-title voice,
the masthead survey plate (in-flow two-column form), the collapsed card face
(the ring bake's geometry: 26px chamfer, 1px gradient hairline via the
padding trick, gold-duotone photo, dot-veil hover resolve, gold chip, 420:680),
and the left reel menu. Import order on the routes is load-bearing:
`landing.css` (fonts/tokens/hud/hero) first, `arcs.css` last.

### Naming

“**Arc page / client arc**” (this surface) vs “**the Arc**” (the
Navigate → Encode → Build loop) — LANGUAGE.md row added; never shorten “arc
page” to “the Arc.” Note the neighboring names that do NOT belong to this
surface: `/claude-workshop` (the corridor-prototype fork route) vs
`/arcs/claude-workshop` (the ported deck); corridor `arc-cases/` components
vs `components/arcs/`.

## Update 1 — viewport-beat rhythm (2026-07-27, owner)

First render read as "a glorified Word document" (owner). The fix is the
deck rhythm the Shards pages had: **every section is one full-viewport
beat** — `.arc-sec` / `.arc-inter` / `.arc-close` are `min-height: 100svh`
grids with `align-content: center`, the head band gets a clear breath
before the body (`margin-bottom` up to ~112px), and all intra-section
spacing (card padding, group rows, anatomy rows, tips, receipts) widened.
Long sections simply grow past the viewport. Mobile (≤900px) releases the
min-height and reads as a spaced flow — the beat idiom is for desktop
rooms. Do not re-tighten section rhythm to fit more per screen; one idea
per viewport is the point.

## Consequences

- New arcs are content-only: one module in `lib/arcs/content/`, one registry
  entry, assets under `public/arcs/<slug>/` — no new components.
- The landing's First Load JS is untouched: arc routes import no three.js, no
  Supabase, no `LandingPage`; `lib/v7-parse` stays server-side.
- ~49 MB of deck mp4s ship in `public/videos/` (small encodes; posters make
  page load video-free until play).
- The static-export packager (`scripts/package-homepage-static.mjs`) will
  include `(marketing)/arcs`; the routes build statically so this is safe.
  Quarantine them there if the homepage zip should stay lean.
- Owner-supplied card/hero photography can replace the interim images by
  editing `cardImage` / `hero.image` per arc — duotone is applied in CSS, so
  any photo works.
