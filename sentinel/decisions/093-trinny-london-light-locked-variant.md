# ADR-093: /trinny-london — a light-locked homepage variant, on its own clock

**Date:** 2026-09-09
**Status:** Accepted
**Surfaces:** `app/(marketing)/trinny-london/**`, `public/prototypes/v7/landing-trinny-london.html`, `lib/theme/{themeLock,themeBootstrap}.ts`, `components/landing/v7/ThemeLock.tsx`, `components/landing/v7/rail-instruments/journeyOrder.ts`, `lib/rail-manifest/resolveActiveIdx.ts`, `app/layout.tsx`
**Related:** ADR-053 (the homepage-variant recipe this repeats), ADR-058 (the theme channel it overrides), ADR-059 (the four-corner scheme and its two clocks), ADR-055 (the nav-corner readout), ADR-056 (the casefile at the front of the services runway), ADR-031 (the rail and its ladder)

## Context

A prospective client asked for a pitch: what was built at another brand, and
what would be built for them. The deliverable is a page rather than a deck —
the site's own frame is the argument — but three things about it are not the
site's.

It is **composed in light**, and a reader arriving with `tf-theme=dark` in
their storage from an earlier visit would open it in a theme nobody designed
it in. It is **handed to one reader**, so it is unlisted. And its sections run
in the ADR-053 order — hero → about → the Arc → the proof casefile → contact —
which the landing's journey rail cannot describe.

## Decision

The ADR-053 recipe, a second time, plus three mechanisms this route needed and
the site did not have.

### 1 · The recipe, on a fork

`getTrinnyLondonContent()` beside its two siblings, reading
`landing-trinny-london.html` — a byte copy of the workshop prototype at the
fork. The same `removeStations` list, the same `corridorMountId`, no
relocation, the same two traps in comments (never list `approach`; `tools` does
not exist here). `extractV7Text()` still reads the PRODUCTION prototype, so the
thesis reads identically on every surface.

**A fork rather than a shared read**, because this page's hero copy and its
proposition sections are client-specific and land in a later phase. One
prototype would make every copy edit here a silent change to
`/claude-workshop`, whose own guard pins structure only.
`tests/lib/trinny-london-parse.test.ts` is this fork's guard, and its last case
is the only one that can tell the two files apart while they are identical: it
checks the PATH, on disk and in the source, which is also what Vercel's file
tracer needs to find.

The route sheet carries ADR-053's two neutralisations under `.tl-root` — the
entry hold restored to native sticky so the armed corridor frame cannot paint
over the bio, and the nav-corner readout suppressed in favour of the bars —
plus the switch rule below.

### 2 · The light lock

`LIGHT_LOCKED_ROUTES` in `lib/theme/themeLock.ts`, hand-written like
`HERO_ROUTES` and for the same reason: nothing else in the codebase knows a
route was composed in one theme. The pre-paint bootstrap moves out of
`app/layout.tsx` into `lib/theme/themeBootstrap.ts` (the `heroPreloadScript()`
precedent — it is a string, so it is built from the constants the app reads and
pinned by a test) and checks the route FIRST, stamping `data-theme="light"` and
`data-theme-lock="light"` before anything paints.

**The lock beats a stored preference AND `?theme=dark`.** A pitch page has no
legitimate dark reading, and the smoke asks for dark specifically to prove it
does not get it.

**It never writes storage.** `data-theme` is a paint decision; `tf-theme` is
the visitor's. A lock that persisted itself would follow the reader back to `/`
and change a site they never asked to change.

`ThemeLock` is a client leaf covering the case the bootstrap cannot reach — a
`next/link` entry, where no document script runs — and the exit, where the
visitor's own theme is handed back from the storage the lock never touched.
Two things about it are load-bearing:

- ⚠ **It stamps the attribute and then calls `hydrateFromDom()`.** The
  attribute is only the CSS channel; the WebGL painters and the services
  drawer's bake read `themeModeRef` and the store (`.claude/rules/services-ring.md`
  already records that a raw attribute write does not re-bake). `hydrateFromDom`
  is ref + state + notify with no DOM and no storage — ADR-058's contract minus
  persistence, which is exactly what a lock wants. Verified live: the corridor's
  particle sphere paints its light palette.
- ⚠ **`useLayoutEffect`, not `useEffect`.** Passive effects run child-first, so
  on a client-side entry `HeroThemeGlitch` would subscribe first (capturing
  dark), and the lock's notify would then read as a real flip — warming BOTH
  hero plates, ~780 kB, on a page that can never toggle. Nothing on screen
  would say so.

The switch is hidden by a rule keyed on `<html>`, not on `.tl-root`:
`SettingsCluster` is a SIBLING of the wrapper in its own fixed overlay, so a
descendant selector cannot reach it, and the lock attribute is the honest
condition — it cannot outlive the lock across a navigation.

⚠ **`THEME_TOGGLE` off is still ADR-058's rollback**, and it takes the lock
with it: the whole site returns to the pre-ADR-058 dark page, this route
included. The bootstrap edit sits inside that gate so the flag keeps one
meaning.

### 3 · A journey clock of its own

⚠ **The production roster cannot be reordered, and the failure is silent.**
`markState` decides `passed` / `here` / `ahead` by comparing INDICES, so a mark
carries its production position with it: `row("about")` holds readout index 3,
behind Services at 2, so About would read `ahead` while the reader is at the
offer, and `beat("thesis")` would read `passed` while they are still in the
bio. Every mark renders, nothing throws, and the frame lies about where the
reader is.

`journeyOrder.ts` clocks a variant on ONE ordered list of its own section ids,
every mark row-clocked against a position in that list — the arcs' solution
(`arcMarks.ts`), applied to a route that still reads the landing's attribute
bus. It resolves loudly, as `clusters.ts` does, because a variant roster has no
drift guard of its own. `TRINNY_JOURNEY_ORDER` lives beside the route's parse
options: the page order IS that file.

`resolveActiveIdx` gains `preMountStationId`. Its seam-gap rule was written as
`idx === 0` when hero was the only page opener; the mount is not a `.station`,
so `data-active-station` lags on whatever station precedes it — `about` here —
and without the parameter that mark stays gold through the whole Arc. The
default is byte-identical for `/`.

`HudNav`'s items become a prop. They are hardcoded in React, so the parse-time
link cleanup cannot reach them and this page would ship `#voidwalker` and
`#practice` as dead anchors in a drawer counting four. ⚠ **A prop, not a
mount-time filter**: the row and the drawer are server-rendered and the head
prints `0{n}`, so filtering in an effect would flash the dead links on the hero
and change the count after hydration — and would alter `/claude-workshop`.

## Alternatives rejected

- **Reusing the workshop prototype.** The two pages diverge by design in the
  next phase; sharing would make a Trinny copy edit a silent workshop edit.
- **Reordering the production marks.** `markState`'s index compare, above.
- **Hiding the journey row instead of clocking it.** An empty top-left corner
  against a populated bottom-right reads as broken on a link handed to a client.
- **A `useEffect` lock.** A flash of dark on client-side entry, and the glitch's
  double warm.
- **Writing the lock through `setMode`.** It persists; the visitor's own choice
  would follow them home.
- **Filtering `NAV_ITEMS` at mount.** SSR flash, post-hydration count change,
  and it would touch `/claude-workshop`.
- **A `(internal)` route or a proxy block.** `(internal)` is for dev routes, and
  a crawler must FETCH a page to see a noindex — the same reason `app/robots.ts`
  does not disallow `/arcs/*`. The route is `noindex, nofollow` and absent from
  `app/sitemap.ts`.

## Consequences

- **`/` and `/claude-workshop` are unchanged** where it counts: the production
  defaults on every new prop and parameter are byte-identical, the HUD pixel
  snapshots pass without `--update-snapshots`, and `landing-corridor-smoke`,
  `services-ring-smoke` and `arc-portfolio-smoke` are green.
- **`landing-import-doctrine` now walks all three marketing entries.** The
  doctrine is about a ROUTE's First Load JS and it had only ever walked the
  homepage; `/claude-workshop` had been unwalked since ADR-053.
- **The forked prototype deploys and is world-fetchable** under `/prototypes/`
  (robots-disallowed only) — the same exposure class as the unlisted route, and
  worth remembering when the client-naming copy lands.
- **With the switch hidden and no session control, the exit mark sits ~10px
  inboard of the rail track** for anonymous visitors: `.rin-settings` bakes the
  switch's half-width into its `right:`. Accepted for now; a signed-in owner
  re-anchors it.

## Two defects found by looking, both after every gate was green

1. ⚠ **The rail printed production's SECTOR denominator — `01/07` on a
   five-row page**, with all six marks correct beside it. `useJourneyMarks`
   seeded its state with `READOUT_SECTIONS.length` and its bail-out compared
   only the POSITION; at rest on the hero every position is 0, so the first
   update compared equal and the seed survived every later frame. The seed now
   comes from the roster and the check compares the total. The guard asserts on
   a roster whose total is NOT production's — a future variant with seven rows
   would hide the same bug again.
2. ⚠ **`/claude-workshop` never imported `rail-instruments.css`**, and the
   symptom was not "some chrome is unstyled": `LandingPage` mounts
   `SettingsCluster` on every route, so with no sheet the cluster fell to
   `position: static` and rendered in normal flow at the FOOT of the document —
   measured y 8346, ~8000px below the fold — carrying the theme switch with it.
   `theme.css` styles `.theme-toggle` and nothing else in that family, which is
   why the control existed and could not be found. Fixed in its own commit; this
   route imports the sheet for the same reason.

## Verifying

```bash
npx vitest run tests/lib/trinny-london-parse.test.ts tests/lib/trinny-london-journey.test.tsx \
  tests/lib/theme-lock.test.tsx tests/lib/hero-preload.test.ts \
  tests/lib/rail-instrument-marks.test.ts tests/lib/landing-import-doctrine.test.ts
npx playwright test tests/visual/trinny-london-smoke.spec.ts --project=desktop
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop   # UNCHANGED, no --update-snapshots
npx playwright test tests/visual/landing-corridor-smoke.spec.ts tests/visual/services-ring-smoke.spec.ts --project=desktop
node scripts/capture-trinny-london.mjs --vp 1920x1247        # headed; LOOK at the stills
```

⚠ The capture is **headed and at 1920×1247** by default — every reference
viewport in this repo is landscape while the owner runs a tall window, and
headless leaves the corridor canvas dead.

## Left open

- The nav-corner readout is suppressed (bars only), inherited from ADR-053.
  `useActiveSection` has no roster parameter; giving it one is a later phase's
  work, and belongs with the sections that phase adds.
- The page ships the workshop prototype's hero copy and bio. Both are
  owner-tunable and expected to change.
