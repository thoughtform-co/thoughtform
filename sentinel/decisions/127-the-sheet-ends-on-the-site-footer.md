# ADR-127: The sheet ends on the site footer — the wordmark docked, the footer risen

- **Status:** Proposed (2026-09-26, owner) — shipped and guarded; flips to
  Accepted once the owner has read it live.
- **Surface:** every sheet route — `/musings`, `/musings/<slug>`,
  `/home-sessions`, the five `/arcs/<client>` pages and `/test/subpage-kit`:
  `components/sheet/sheet.css` (§0 the root, a wordmark rule, §14b),
  `components/sheet/SheetRenderer.tsx` (the body wrapper and `rise`),
  `components/sheet/SheetClose.tsx` (comment), the five route files (one import,
  three `rise`), `lib/site/footer-nav.ts` (root-relative anchors),
  `components/sheet/instrument.css` (one rule retired),
  `components/landing/v7/site-footer/site-footer.css` (comments only). The
  landing is untouched; `/arcs` (the instrument) loses its private rule and
  gains nothing else.
- **Supersedes:** [ADR-118](118-the-arcs-overview-is-an-instrument.md)'s
  finding 11 (the instrument docked the wordmark for itself, with a hardcoded
  0.68 — generalised to every sheet, on the frame's token);
  [ADR-114](114-the-sheet.md) §5's close, which promised the landing's footer
  and shipped its bare markup. [ADR-043](043-wordmark-bottom-left.md)'s
  centred rest is stated as HERO-only, which it always was.
- **Related:** [ADR-105 U4](105-the-page-ends-on-a-bold-footer.md) (the
  landing's ending, which this transposes onto a flowing document),
  [ADR-105 U2](105-the-page-ends-on-a-bold-footer.md) (the link grid and its
  test), [ADR-070 U35](070-configuration-is-a-switchboard.md) (a losing rule
  goes with its guards).

## The ask

Owner, 2026-09-26:

> I want to clean up our musings page a bit. I kind of like it. A few things:
> The wordmark at the bottom should be in the bottom-left corner. Right now it
> inherits the behavior from our homepage, where it's slightly more centered,
> because that works with our key visual. On this musings page, though, we
> don't have a hero or a visual so it should immediately be in the bottom-left
> corner when you enter the musings overview page and its subpages. The footer
> is super weird. I want to clean that up as well and have the footer with the
> parallax effects, as on our homepage.

Two scope rulings, asked and given the same session: the docked wordmark goes
on **every hero-less sheet page** (`/home-sessions` and the client pages behave
exactly as `/musings` did, and the reason is the same), and the footer takes
**the full ending** — the rise over the previous content, the drift and the
dim under it, and the gliding key visual — not only the styled footer.

## What was found

1. **The footer's sheet was never loaded on a sheet route.** `SheetClose`
   mounts the landing's `SiteFooter`, and `site-footer.css` was imported by
   exactly one file, `app/(marketing)/page.tsx`. On every sheet route the
   footer rendered as its bare markup: both theme plates stacked in flow inside
   the band (nothing hid the other theme's `<img>`), no scrim, a body-size
   title, bare link lists, an empty diamond. The turnstone still
   `wave-02-sb/MU - Musings index/MU-void__sb_04.png` shows exactly this, and
   two comments in `site-footer.css` said the sheet already glided.
2. **The wordmark's rest position is the hero's.** `.hud__brand` rests at the
   hero's content column at full size and docks to the rail's corner
   (`.is-collapsed`) only once a scroll writer has seen half a viewport
   (`HudNav` on the landing, `useArcScroll` and `ArcHudNav` on a sheet). That
   rest exists for the hero's key visual, and no sheet has a hero. `/arcs` had
   fixed it for itself (`instrument.css`, profile-scoped, `scale(0.68)`
   literal); `/home-sessions` and the five client pages were as broken as
   `/musings`.
3. **Four dead links.** `station()` and `arcLink()` in `footer-nav.ts` emitted
   bare anchors — `#services`, `#about`, `#voidwalker`, `#home-corridor-mount`
   — that exist only on `/`. On a sheet they were perfectly good links to
   nowhere, and `footer-nav.test.ts` resolved `#` hrefs against the landing's
   DOM only.
4. **Every gate excluded the close.** The rubric (0.1.2), the capture's
   mechanical gate (`--exclude .sh-sec--close`) and `subpages-smoke` (the
   overrun walk skips `.ft-foot`) all looked away from the last section, for
   the good reason that the first wave graded it as a section and failed it.
   Nothing measured whether the footer PAINTED. Two weeks.

## The decision

### 1. The footer's sheet is the route's to load

Each of the five routes that mount a close imports
`components/landing/v7/site-footer/site-footer.css` directly after `sheet.css`
and before `theme.css` — route-level, like every sheet in this house (the only
component-level CSS imports are four `./local.css` under `components/admin` and
`components/gateway`). Nothing in it leaks onto a sheet: `.stations`,
`#contact.station` and the `#musings:has(…) ~ #contact.station` weld match
nothing there, and it has no `body` or `:root` rule. The key visual's glide
(`.ft-foot`'s own view timeline, `entry 0% → 100%`) works on a sheet unchanged
the moment the file loads. `sheet-close.test.ts` pins the import per route, in
order, and fails any new `SheetRenderer` host under `app/` that is neither
listed with its `rise` nor one of the two closeless instrument pages.

### 2. The wordmark is docked from the first frame on every sheet

One rule in `sheet.css`, after the root:

```css
.sh-root .hud__brand {
  left: var(--hud-margin);
  transform: scale(var(--hud-brand-dock));
}
```

The frame's own docked state, declared for BOTH of its states: same values, so
the 0.4s transition has nothing to animate and the half-viewport toggle paints
nothing. `(0,2,0)` ties `.hud__brand.is-collapsed` and wins on order — sheet.css
follows landing.css on every route — and the values are identical either way.
`--hud-brand-dock` is on `:root`. The class stays the writers'. ≤960 hides the
wordmark outright. ⚠ Never in `landing.css`: `hud-brand-tokens.test.ts` slices
that file at `.hud__brand {`. The instrument's private copy is retired into it.

### 3. Station links are root-relative

`/#services`, `/#about`, `/#voidwalker`, `/#home-corridor-mount`. On `/` a
root-relative fragment href is a same-document fragment jump, identical to the
bare form (the landing delegates no `a[href^="#"]` click — `HudNav` binds only
its own `NAV_ITEMS`, `RailManifest` only the rail); from a sheet it reaches the
landing. `footer-nav.test.ts` admits the prefix, strips it before resolving
the anchor against the parsed DOM, tests the sitemap on the path alone, refuses
any bare `#`, and counts the anchors it walked (a prefix that hid every anchor
from the resolver would have passed it vacuously).

### 4. The body drifts under the close — the rise on a flowing document

The landing's ending (ADR-105 U4) needs a sticky stage: `#musings` stays pinned
for one weld of runway while `#contact`, pulled up by the same weld, rises over
it; the stage drifts −0.25 × the rise and dims on the runway's view timeline.
A sheet pins nothing. So:

- **`SheetRenderer` wraps every section but the close in `.sh-body`**, and the
  close follows as its sibling. With `rise`, the body carries `data-sh-rise`.
  The wrapper is invisible to every reader — the capture, the smoke and the
  composition law query `.sh-sec[data-sh-arrangement]` as descendants, and no
  selector in `components/sheet` is a child or `:scope` combinator.
- **The weld pair, outside any gate:** `.sh-body[data-sh-rise] { padding-bottom:
var(--ft-weld) }` and `.sh-body[data-sh-rise] + .sh-sec--close { margin-top:
calc(-1 * var(--ft-weld)); z-index: 2 }`. Net document height zero.
  `--ft-weld: 100svh` is declared on `.sh-root` — the landing's number, declared
  again because a sheet has no `.stations` for the footer's sheet to reach;
  `sheet-close.test.ts` pins the two equal.
- **The drift and the dim, on the compositor**, inside `@supports
(animation-timeline: view())` and `(min-width: 961px) and
(prefers-reduced-motion: no-preference)` — the landing's gate exactly: the
  body is its own view timeline (`--sh-run`) and animates `translateY(0 →
0.75 × var(--ft-weld))` over `contain calc(100% − var(--ft-weld)) contain
100%`; its `::after` is a `--sh-ground` veil at `z-index: 3` going `opacity
0 → 0.4` on the same range. The range is the landing's token for token
  (`musings.css`'s `.mu__stage`, `--mu-rise` for `--ft-weld`) and the test
  pins that: the body is taller than the frame, so `contain 100%` is its
  bottom on the frame's floor — the close's top on the frame's top — and the
  range opens one weld of scroll before it, the close's top entering the
  floor. Independent of the close's own height, which is taller than the frame
  at 720h (1027px, ADR-105 §7). A body moving DOWN three quarters of the rise
  under a footer moving at full speed is a body moving at a quarter of scroll
  speed: the pinned list's read, exactly. NO GAP CAN OPEN: at rise fraction
  `f` the body's content bottom sits at `vh − 25f` and the close's top at
  `vh − 100f`.
- ⚠ **THE WHOLE BODY, NEVER THE LAST SECTION ALONE.** Both musings pages end on
  a section shorter than the rise (the table ≈ 60–70svh, the related figure
  ≈ 75–80svh at 1247), and a short section drifting by itself opens
  `0.75 × (100svh − H)` of void between it and the section above. The body's
  top is a document away when the rise begins. This is the GSAP ScrollSmoother
  pattern — one transformed wrapper for the page — desktop-only under the
  gate.
- ⚠ **OPT-IN PER PAGE, NOT DERIVED.** The client pages end on the sticky
  console (`.sh-console__panel`, the pile's slots), and a stuck element inside
  a drifting body slides down at 0.75× for the whole rise. `/musings`,
  `/musings/<slug>` and `/home-sessions` pass `rise`; the client pages and the
  kit do not, and get a normal footer that follows in flow. `/arcs` has no
  close and no runway. The test pins which routes pass it.
- ⚠ **THE ROOT CLIPS BOTH AXES.** `overflow-x: clip` became `overflow: clip`:
  a transformed box still contributes to scrollable overflow, so at the rise's
  end the body's painted box reached 0.75 of a frame past the close and the
  page scrolled on into drifted void under the plate. `clip` is not a scroll
  container (the file's own law — `hidden` would kill the console's sticky),
  so the console's panel and the prose meta keep their scrollport; the fixed
  HUD, the nav drawer and the knobs have the viewport as containing block and
  are not clipped. Measured after: `scrollHeight` equals the root's height on
  every rising route.
- ⚠ **THE BODY IS ITS OWN TIMELINE SUBJECT**, where the house pattern puts the
  timeline on a runway and the drift on its child. Safe because a view timeline
  reads the LAYOUT box: the transform does not feed back into the range, and
  the measured drift is the arithmetic to the pixel (below). If a later read
  finds feedback, the fallback is the timeline on the close (`view-timeline:
--sh-close` on `.sh-sec--close`, `timeline-scope: --sh-close` on `.sh-root`,
  range `entry 0% cover var(--ft-weld)`) — the same arithmetic, one more
  declaration.
- ⚠ **NEVER A TRANSFORM ON THE CLOSE** (ADR-105 U4: the margin is layout and
  the scroll moves it; only its key visual glides). ⚠ **NEVER `opacity` ON THE
  BODY**: the veil is a pseudo over it, so the ink dims under one ground rather
  than through it.
- **Degradation.** Firefox has no scroll timelines: `@supports` leaves no
  animation, the weld pair nets zero, the footer follows the content as a
  normal footer. The phone and reduced motion: the same. A page with less than
  one viewport of body would begin its rise at scroll 0; no page is that
  short, and the landing has the same bound.

### 5. What is not taken

The client pages' ending (the console), the instrument, the phone. The
capture's exclusion of the close from the mechanical gate and the rubric's
0.1.2 stand — the close is the landing's footer and the landing's own gate
measures it (`mechanical.mjs --scope ".ft-foot" --prm`, run on `/musings` in
both themes below); what changed is that the smoke now measures that it
PAINTS.

## Measured

Against the dev server, headless Chromium, `reducedMotion: no-preference`.

| where                                          | mid-rise (close top at vh/2) | end of document                            |
| ---------------------------------------------- | ---------------------------- | ------------------------------------------ |
| `/musings` 1920×1247 dark                      | drift 467.87 · veil 0.200    | drift 935.25 · veil 0.4 · close top −50.8  |
| `/musings` 1920×1247 light                     | drift 467.87 · veil 0.200    | drift 935.25 · veil 0.4                    |
| `/musings` 1280×720 dark                       | drift 270.21 · veil 0.200    | drift 540.00 · veil 0.4 · close top −307.3 |
| `/musings/navigate-the-intelligence` 1920×1247 | drift 467.67 · veil 0.200    | drift 935.25 · veil 0.4                    |
| `/home-sessions` 1920×1247                     | drift 467.72 · veil 0.200    | drift 935.25 · veil 0.4                    |

0.375 × 1247 = 467.6 and 0.75 × 1247 = 935.25; 0.375 × 720 = 270 and 0.75 × 720
= 540. `scrollHeight` equalled the root's height on every route (3442 · 3442 ·
2557 · 3641 · 4487). The close's top past the frame's top at the end is the
close being taller than the frame (50px at 1247, 307 at 720 — ADR-105 §7's
number). At rest: `.hud__brand` without `is-collapsed`, `matrix(0.68, 0, 0,
0.68, 0, 0)`, `left` equal to `--hud-margin` through a probe box, on all five
routes; exactly one `.ft-foot__plate-img` painted, its `currentSrc` the hero's
`Gateway_v1b`, the hidden theme's empty; the plate's rect equal to the close's
within 1px, spanning `innerWidth`; the close's top on the body's last section's
bottom on every route; `paddingBottom` equal to `innerHeight` on the three
rising routes and 0 on `/arcs/loop`.

## Guards

- `tests/lib/sheet-close.test.ts` (new): the import per route, in order; no
  other `SheetRenderer` host without it; the anchors root-relative; the root's
  weld once, equal to the landing's, `overflow: clip`; the wordmark rule on
  the frame's token, the instrument's copy gone, nothing in `landing.css`; the
  weld pair; no transform under `.sh-sec--close`; the rise block gated, its
  range equal to `musings.css`'s token for token, the keyframes' 0.75 and 0.4;
  the renderer's wrapper and sibling; which routes pass `rise`.
- `tests/visual/subpages-smoke.spec.ts` "the ending (ADR-127)": the wordmark's
  seat, the plate, the weld, the runway, the ViewTimeline animations by target,
  the drift and the veil mid-rise and at the end, the page ending on the
  close; the phone's body carries no view-timeline animation.
- `tests/lib/footer-nav.test.ts`: the prefix, the resolver, the sitemap on
  the path, no bare `#`, the anchor count.
- `arcs-instrument-smoke` (the wordmark's clearance on `/arcs`, now under the
  shared rule) and `arc-terminal-smoke` (the arc detail pages, which do not use
  `SheetRenderer`) pass unchanged: 36 of 36.

## Left open

- ⚠ **`subpages-smoke`'s "the kit's pile stacks under a panel that sticks" is
  red on `main` BEFORE this ADR.** Proven on a detached worktree at `dd05fc76`
  (the commit before this pass's first): received `152.859375` there and
  here, to the digit. Its first read (`scrollTo(top − 96)`) lands with the
  section's top at 96 and the panel's natural top at 216.86 — 152.86 above its
  stuck seat of 64 — so the panel is NOT yet stuck when it is first measured,
  and the assertion compares an unstuck read with a stuck one. Probed with the
  `.sh-body` wrapper removed from the DOM: identical numbers. The panel itself
  sticks correctly. The smoke's own bug; not fixed in this pass.
- The corner readout scrambles to CONTACT as the close crosses the midline
  (`ArcHudNav` on painted rects) — visible mid-rise as `CONTACI` in a still,
  the readout's own decode. Pre-existing behaviour of the readout.
- The capture (`capture-subpages.mjs`) still excludes the close from the
  mechanical gate, and the rubric never grades it. The smoke measures paint;
  nothing grades the close's composition on a sheet. Owner's call whether it
  should.
- The post page's sticky meta column is bounded by `.sh-prose` and is released
  before the rise on the current posts; a post whose article is shorter than
  its meta column would carry it into the rise. Not measured; no such post.

## Verification

```bash
npx vitest run tests/lib/sheet-close.test.ts tests/lib/footer-nav.test.ts tests/lib/hud-brand-tokens.test.ts tests/lib/type-material-tokens.test.ts tests/lib/theme-css-sweep.test.ts tests/lib/phone-viewport-units.test.ts tests/lib/musings-row.test.ts tests/lib/sheet-composition.test.ts tests/lib/sheet-instrument.test.ts
npx tsc --noEmit
npx playwright test tests/visual/subpages-smoke.spec.ts --project=desktop        # 17 of 18; the kit case is the pre-existing red above
npx playwright test tests/visual/arcs-instrument-smoke.spec.ts tests/visual/arc-terminal-smoke.spec.ts --project=desktop
```

then, from PowerShell (Git Bash rewrites a `/route` argument):

```powershell
node scripts/design-eval/mechanical.mjs --url /musings --theme dark  --scope ".ft-foot" --prm
node scripts/design-eval/mechanical.mjs --url /musings --theme light --scope ".ft-foot" --prm
```

and LOOK, at 1920×1247 and 1280×720 in both themes: the wordmark in the corner
on load with no jump at half a viewport; the plate full-bleed with one theme's
image; the footer rising over the list or the article, the content drifting
slowly and dimming under it, the key visual gliding; scrolling back, the body
un-drifting with no gap; the top-right drawer and the knobs still painting.
The client page keeps a normal footer under its console.
